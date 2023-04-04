import { Injectable, Logger } from "@nestjs/common";
import { Socket, Namespace } from "socket.io";
import { IChannelToEmit, IUserToEmit } from "./chat.interface";
import { MessageChannelEntity } from "./messageChannel/messageChannel.entity";
import { MessageChannelService } from "./messageChannel/messageChannel.service";
import { MessagePrivateEntity } from "./messagePrivate/messagePrivate.entity";
import { MessagePrivateService } from "./messagePrivate/messagePrivate.service";
import { ChannelEntity } from "./channel/channel.entity";
import { ChannelService } from "./channel/channel.service";
import { UserService } from "../user/user.service";
import { UserRoomHandler } from "./chat.classes";
import { UserDto } from "src/user/user.dto";
import { UserEntity } from "src/user/user.entity";
import { channel } from "diagnostics_channel";
import { createChannelDto } from "./chat.gateway.dto";

@Injectable({})
export class ChatService {
    constructor (
        private messageChannelService: MessageChannelService,
        private messagePrivateService: MessagePrivateService,
        private channelService: ChannelService,
        private userService: UserService
    ) {}

    private sendEssentialUserData(userEntity: UserEntity): IUserToEmit {
        return {
            id: userEntity.id,
            login: userEntity.login
        }
    }

    private sendEssentialChannelData(channelEntity: ChannelEntity): IChannelToEmit {
        return {
            id: channelEntity.id,
            date: channelEntity.date,
            name: channelEntity.name,
            password: channelEntity.password,
            inviteOnly: channelEntity.inviteOnly,
            persistant: channelEntity.persistant,
            onlyOpCanTalk: channelEntity.onlyOpCanTalk,
            hidden: channelEntity.hidden,
            normalUsers: channelEntity.normalUsers,
            opUsers: channelEntity.opUsers,
            godUser: channelEntity.godUser
        }
    }

    private goBackToGeneral(client: Socket) {
        let locGeneral: ChannelEntity = {
            id: "general",
            name: "general",
            date: new Date(),
            password: false,
            channelPass: null,
            opNumber: 0,
            inviteOnly: false,
            persistant: true,
            onlyOpCanTalk: false,
            hidden: false,
            normalUsers: [],
            opUsers: [],
            messages: []
        }
        client.emit('newLocChannel', {channel: locGeneral, status: "normal"}, []);
    }

    private async delUserFromChannel(userId: string, channelId: string, roomHandler: UserRoomHandler) {
        await this.channelService.delUser(userId, channelId);
        let user = roomHandler.userMap.get(userId);
        if (user != undefined) {
            user.socket.emit("leaveChannel", channelId);
            if (user.isChannel && user.room == channelId) {
                roomHandler.joinRoom(userId, 'general', true, false, false, false);
                this.goBackToGeneral(user.socket);
            }
        }
        let chan: ChannelEntity = await this.channelService.getOneById(channelId);
        if (chan == null)
            roomHandler.roomKill(channelId);
    }

    public connectEvent(client: Socket, user: UserEntity, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.set(user.id, client);
        roomHandler.addUser(user.id, client, "general", true, false, false, false);
        client.emit("changeLocChannel", "general", []);
        chatNamespace.sockets.forEach( (socket) => {
            socket.emit('userConnected', {userId: user.id, userLogin: user.login});
        })
        logger.log(`${user.login} as id : ${user.id} is connected, ${client.id}`);
    }

    public disconnectEvent(user: UserEntity, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.delete(user.id);
        let roomId = roomHandler.delUser(user.id);
        if (roomId != undefined)
            roomHandler.roomMap.of(roomId).emit('notice', user.login, " just disconnect");
        chatNamespace.sockets.forEach( (socket) => {
            socket.emit('userDisconnected', {userId: user.id, userLogin: user.login});
        })
        logger.log(`${user.login} as id ${user.id} is disconnected`);
    }

    public newMessageEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, message: string) {
        logger.debug(`${user.login} send : ${message}`);
        let room = roomHandler.userMap.get(user.id);
        if (room != undefined) {
            let toSend = {date: new Date(), sender: user.login, content: message};
            if (room.isChannel) {
                if (!room.onlyOpCanTalk || room.isOP) {
                    if (room.room != "general") {
                        logger.debug(`${message} to stock in ${room.room}`);
                        this.channelService.getOneById(room.room)
                        .then((channId) => {
                            this.messageChannelService.addMessage(user, channId, message);
                        })
                    }
                    roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
                }
                else
                    client.emit('notice', 'only channel operator can talk in this channel');
            }
            else {
                this.userService.findById(room.room)
                .then((dest) => {
                    this.messagePrivateService.sendPrivateMessage(user, dest, message);
                })
                client.emit('selfMessage', toSend);
                let connected = false;
                let dest = roomHandler.userMap.get(room.room);
                if (dest != undefined)
                    connected = true;
                this.userService.findById(room.room)
                .then(
                    (user) => {
                        client.emit('checkNewDM', {id: room.room, login: user.login}, connected);
                    }
                )
                if (dest != undefined) {
                    let userToEmit: IUserToEmit = user;
                    dest.socket.emit('checkNewDM', userToEmit, true);
                    if (!dest.isChannel && dest.room == user.id)
                        dest.socket.emit("newMessage", toSend);
                    else
                        dest.socket.emit("pingedBy", userToEmit);
                }
            }
        }
        else
            client.emit('notice', 'You are nowhere');
    }

    public changeLocEvent(client: Socket, user: UserEntity, loc: string, isChannel: boolean, roomHandler: UserRoomHandler) {
        if (isChannel)
        {
            if (loc == 'general') {
                roomHandler.joinRoom(user.id, loc, true, false, false, false);
                this.goBackToGeneral(client);
                return;
            }
            else {
                console.log("entries: ", user.id, loc);
                this.userService.getChannelLink(user.id, loc)
                .then(
                    (found) => {
                        if (found) {
                            roomHandler.joinRoom(
                                user.id,
                                loc,
                                true,
                                found.status == "god" ? true : false,
                                found.status == "op" ? true : false,
                                found.channel.onlyOpCanTalk);
                            this.channelService.getMessages(loc)
                                .then((array) => {
                                    client.emit("newLocChannel", found, array);
                                })
                        }
                        else {
                            client.emit("notice", "You not belong to this channel");
                        }
                    }
                )
            }
        }
        else
        {
            this.userService.findById(loc)
            .then (
                (found) => {
                    if (found != null) {
                        roomHandler.joinRoom(user.id, found.id, false, false, false, false);
                        console.log('user currently in room : ', roomHandler.userMap.get(user.id).room, roomHandler.userMap.get(user.id).isChannel)
                        this.messagePrivateService.findConversation(user.id, found.id)
                        .then(
                            (messages) => {
                                console.log(messages);
                                client.emit("newLocPrivate", found.id, found.login, messages);
                            }
                        )
                    }
                    else
                        client.emit("notice", `User ${loc} not found`);
                }
            )
        }
    }

    async listChannelEvent(client: Socket, user: UserEntity) {
        let channelsArray: IChannelToEmit[] = await this.channelService.listChannelsWhereUserIsNot(user);
        client.emit("listChannel", channelsArray);
    }

    public listMyChannelEvent(client: Socket, userId: string) {
        this.userService.listAllUserChannel(userId)
        .then(
            (array) => {
                client.emit('listMyChannels', array);
            }
        )
    }

    public listMyDMEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler) {
        this.userService.listDM(user.id)
            .then(
                (mappedDm) => {
                    let arrayToEmit: {userName: string, userId: string, connected: boolean}[] = [];
                    mappedDm.forEach(
                        (pair, login) => {
                            let connected = roomHandler.userMap.get(pair.user.id);
                            if (connected != undefined)
                                pair.connected = true;
                            arrayToEmit.push({
                                userName: login,
                                userId: pair.user.id,
                                connected: pair.connected});
                        }
                    )
                    client.emit("listMyDM", arrayToEmit);
                })
    }

    /**
     * This method emit to the client an array of user: UserEntity belong to a specfic channel
     * with theyre grade: status ("god", "op" or "normal") and inform if his connected state: connected   
     * ordered by grade and name  
     * emit("listUsersChann", {user: UserEntity, status: string, connected: boolean}[]);
     * @param client 
     * @param channelId 
     * @param roomHandler 
     */
    async listUsersInChannel(client: Socket, channelId: string, roomHandler: UserRoomHandler) {
        let usersArray: {user: IUserToEmit, status: string, connected: boolean}[] = await this.channelService.listUsersInChannel(channelId);
        usersArray.forEach((elt) => {
            let connected = roomHandler.userMap.get(elt.user.id);
            if (connected != undefined)
                elt.connected = true;
        })
        client.emit("listUsersChann", usersArray);
    }

    public joinChannelEvent(client: Socket, user: UserEntity, data: {channelId: string, channelPass: string}, roomHandler: UserRoomHandler) {
        this.channelService.getUserInChannel(data.channelId, user.id)
            .then((result) => {
                if (result != null)
                    client.emit("notice", 'already in channel');
                else {
                    this.channelService.getOneById(data.channelId)
                        .then((channel) => {
                            if (channel != null) {
                                if (!channel.inviteOnly) {
                                    if (!channel.password || data.channelPass == channel.channelPass) {
                                        this.channelService.addNormalUser(user, channel.id)
                                            .then(() => {
                                                this.listMyChannelEvent(client, user.id);
                                                this.changeLocEvent(client, user, data.channelId, true, roomHandler);
                                            })
                                    }
                                    else
                                        client.emit("notice", "Wrong channel password");
                                }
                                else
                                    client.emit("notice", "this channel is on invite only");
                            }
                            else
                                client.emit("notice", "no such channel");
                        })
                }
            })
    }

    public inviteUserEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToInvite: string, channelId: string) {
        this.channelService.getUserInChannel(channelId, userId)
        .then((found) => {
            if (found != null) {
                if (found.status != "normal") {
                    this.userService.findById(userToInvite)
                    .then((userEntity) => {
                        if (userEntity != null) {
                            this.channelService.getUserInChannel(channelId, userToInvite)
                            .then(
                                (alreadyHere) => {
                                    if (alreadyHere == null) {
                                        this.channelService.addNormalUser(userEntity, channelId)
                                        .then( () => {
                                            let logged = roomHandler.userMap.get(userToInvite);
                                            if (logged != undefined)
                                                this.listMyChannelEvent(logged.socket, userToInvite);
                                        })
                                    }
                                    else
                                        client.emit("notice", `The user ${userToInvite} already belong to this channel.`);
                                }
                            )
                        }
                        else
                            client.emit('notice', `The user ${userToInvite} doesn't exists.`);
                    })
                }
                else {
                    this.channelService.getOneById(channelId)
                    .then(
                        (chanOpts) => {
                            if (!chanOpts.inviteOnly) {
                                this.userService.findById(userToInvite)
                                .then((userEntity) => {
                                    if (userEntity != null) {
                                        this.channelService.getUserInChannel(channelId, userToInvite)
                                        .then(
                                            (alreadyHere) => {
                                                if (alreadyHere == null) {
                                                    this.channelService.addNormalUser(userEntity, channelId)
                                                    .then( () => {
                                                        let logged = roomHandler.userMap.get(userToInvite);
                                                        if (logged != undefined)
                                                            this.listMyChannelEvent(logged.socket, userToInvite);
                                                    })
                                                }
                                                else
                                                    client.emit("notice", `The user ${userToInvite} already belong to this channel.`);
                                            }
                                        )
                                    }
                                    else
                                        client.emit('notice', `The user ${userToInvite} doesn't exists.`);
                                })
                            }
                            else
                                client.emit("notice", "only channel operators can invite to this channel");
                        }
                    )
                }
            }
            else
                client.emit("notice", "You not belong to this channel.");
        })
    }

    public leaveChannelEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, channelId: string) {
        logger.debug('leave channel request');
        this.channelService.getUserInChannel(channelId, user.id)
        .then( (found) => {
            if (found != null && found.status != "god") {
                this.delUserFromChannel(user.id, channelId, roomHandler);
            }
            else
                client.emit('notice', 'you are not registered to that channel.');
        })
    }

    public makeHimOpEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToOp: string, channelId: string) {
        this.channelService.getUserInChannel(channelId, userId)
        .then(
            (link) => {
                if (!link || link.status != "god") {
                    client.emit("notice", "You cannot.");
                }
                else {
                    this.channelService.getUserInChannel(channelId, userToOp)
                    .then(
                        (linkToOp) => {
                            if (!linkToOp)
                                client.emit("notice", "user not in channel");
                            else if (linkToOp.status == "op")
                                client.emit('notice', "this user is already operator to this channel");
                            else {
                                this.channelService.upgradeUserOnChannel(linkToOp.user, channelId);
                                roomHandler.userMap.userBecomeOp(userToOp, channelId);
                            }
                        });
                    }
                });
    }

    public makeHimNoOpEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToNoOp: string, channelId: string) {
        this.channelService.getUserInChannel(channelId, userId)
        .then(
            (link) => {
                if (!link || link.status != "god")
                    client.emit("notice", "You cannot.");
                else
                    this.channelService.getUserInChannel(channelId, userToNoOp)
                    .then(
                        (linkToDeOp) => {
                            if (!linkToDeOp)
                                client.emit("notice", "user not in channel");
                            else if (linkToDeOp.status != "op")
                                client.emit("notice", "This user is not operator to this channel");
                            else {
                                this.channelService.downgradeUserOnChannel(linkToDeOp.user, channelId);
                                roomHandler.userMap.userBecomeNoOp(userToNoOp, channelId);
                            }
                        });
            });
    }

    public kickUserEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToKick: string, channelId: string) {
        this.channelService.getUserInChannel(channelId, userId)
        .then(
            (link) => {
                if (!link || link.status == "normal")
                    client.emit("notice", "You can't do that.");
                else
                    this.channelService.getUserInChannel(channelId, userToKick)
                    .then(
                        (linkToKick) => {
                            if (!linkToKick)
                                client.emit("notice", "This user is not in this channel.");
                            else if (linkToKick.status == "god")
                                client.emit("notice", "God isn't kickable.");
                            else if (linkToKick.status == "op" && link.status != "god")
                                client.emit("notice", "Only god can kick an operator.");
                            else {
                                this.delUserFromChannel(userToKick, channelId, roomHandler);
                            }
                        });
            });
    }

    public createChannelEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, channel: createChannelDto) {
        if (channel.name == 'general') {
            client.emit("notice", "This channel already exists.");
        }
        else {
            this.channelService.getOneByName(channel.name)
            .then(
                (exist) => {
                    if (!exist)
                    {
                        const newChannel: ChannelEntity = {
                            id: undefined,
                            date: undefined,
                            name: channel.name,
                            password: channel.password,
                            channelPass: channel.channelPass,
                            opNumber: 1,
                            inviteOnly: channel.inviteOnly,
                            persistant: channel.persistant,
                            onlyOpCanTalk: channel.onlyOpCanTalk,
                            hidden: channel.hidden,
                            messages: [],
                            normalUsers: [],
                            opUsers: [],
                            godUser: user
                        };
                        this.channelService.create(newChannel)
                        .then(
                            (succeed) => {
                                if (!succeed.hidden)
                                {
                                    roomHandler.userMap.users.forEach(
                                        (userInMap, userId) => {
                                            if (userId != user.id)
                                                this.userService.findById(userId)
                                                .then(
                                                    (userEntity) => {
                                                        this.listChannelEvent(userInMap.socket, userEntity);
                                                    });
                                        });
                                }
                                this.listMyChannelEvent(client, user.id);
                                this.changeLocEvent(client, user, succeed.name, true, roomHandler);
                            });
                    }
                    else
                        client.emit("notice", "This channel already exists.");
                });
        }
    }
}
