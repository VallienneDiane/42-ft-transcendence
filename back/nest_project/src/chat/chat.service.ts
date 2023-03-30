import { Injectable, Logger } from "@nestjs/common";
import { Socket, Namespace } from "socket.io";
import { IChannel, IMessageChat } from "./chat.interface";
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

@Injectable({})
export class ChatService {
    constructor (
        private messageChannelService: MessageChannelService,
        private messagePrivateService: MessagePrivateService,
        private channelService: ChannelService,
        private userService: UserService
    ) {}

    private async messageChannelEntityfier(userId: string, data: IMessageChat): Promise<MessageChannelEntity> {
        let channel = await this.channelService.getOneById(data.room);
        return {
            id: undefined,
            content: data.content,
            date: undefined,
            userId: userId,
            channel: channel
        };
    }

    private channelEntityfier(channProperties: IChannel, founder: UserEntity): ChannelEntity {
        return {
            id: undefined,
            date: undefined,
            name: channProperties.channelName,
            password: channProperties.password,
            channelPass: channProperties.channelPass,
            opNumber: 1,
            inviteOnly: channProperties.inviteOnly,
            persistant: channProperties.persistant,
            onlyOpCanTalk: channProperties.onlyOpCanTalk,
            hidden: channProperties.hidden,
            normalUsers: [],
            opUsers: [],
            godUser: founder,
            messages: []
        };
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
        client.emit('newLocChannel', locGeneral, false, []);
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
        roomHandler.addUser(user.id, client, "general", false, true, false, false);
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
            socket.emit('userDisconnected', user.id);
        })
        logger.log(`${user.login} as id ${user.id} is disconnected`);
    }

    public newMessageEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, message: string) {
        logger.debug(`${user.login} send : `);
        console.log(message);
        let room = roomHandler.userMap.get(user.id);
        if (room != undefined) {
            let toSend = {date: new Date(), sender: user.login, content: message};
            if (room.isChannel) {
                if (!room.onlyOpCanTalk || room.isOP) {
                    this.channelService.addMessage(user.id, message, room.room);
                    roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
                }
                else
                    client.emit('notice', 'only channel operator can talk in this channel');
            }
            else {
                this.userService.sendPrivateMessage(user.id, room.room, message);
                client.emit('selfMessage', toSend);
                let connected = false;
                let dest = roomHandler.userMap.get(room.room);
                if (dest != undefined)
                    connected = true;
                client.emit('checkNewDM', room.room, connected);
                if (dest != undefined) {
                    dest.socket.emit('checkNewDM', user.id, true);
                    if (!dest.isChannel && dest.room == user.id)
                        dest.socket.emit("newMessage", toSend);
                    else
                        dest.socket.emit("pingedBy", user.id);
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

    public listChannelEvent(client: Socket, user: UserEntity) {
        this.channelService.listChannelsWhereUserIsNot(user)
            .then(
                (array) => {
                    client.emit("listChannels", array);
                }
            )
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
    public listUsersInChannel(client: Socket, channelId: string, roomHandler: UserRoomHandler) {
        this.channelService.listUsersInChannel(channelId)
            .then((array) =>{
                array.forEach((elt) => {
                    let connected = roomHandler.userMap.get(elt.user.id);
                    if (connected != undefined)
                        elt.connected = true;
                })
                client.emit("listUsersChann", array);
            })
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

    public leaveChannelEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, channelId: string) {
        logger.debug('leave channel request');
        this.channelService.getUserInChannel(channelId, userId)
        .then( (found) => {
            if (found != null) {
                this.delUserFromChannel(userId, channelId, roomHandler);
            }
            else
                client.emit('notice', 'you are not registered to that channel.');
        })
    }

    public makeHimOpEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToOp: string, channelId: string) {
        // this.linkUCService.findOne(channel, userId)
        // .then((link) => {
        //     if (link == null || !link.isOp)
        //         client.emit('notice', 'You cannot.');
        //     else
        //         this.linkUCService.findOne(channel, userToOp)
        //         .then((found) => {
        //             if (found == null)
        //                 client.emit('notice', "user not in channel");
        //             else if (found.isOp)
        //                 client.emit('notice', "this user is already operator to this channel");
        //             else {
        //                 this.linkUCService.doUserOp(channel, userToOp);
        //                 this.channelService.upgradeOpByName(channel);
        //                 roomHandler.userMap.userBecomeOp(userToOp, channel);
        //             }
        //         })
        // })
        this.channelService.getUserInChannel(channelId, userId)
        .then(
            (link) => {
                if (!link || link.status == "normal") {
                    client.emit("notice", "You cannot.");
                }
                else {
                    this.channelService.getUserInChannel(channelId, userToOp)
                    .then(
                        (linkToOp) => {
                            if (!linkToOp)
                                client.emit("notice", "user not in channel");
                            else if (linkToOp.status == "op" || linkToOp.status == "god")
                                client.emit('notice', "this user is already operator to this channel");
                            else {
                                this.channelService.
                            }
                        }
                    )
                }
            }
        )
    }

    public makeHimNoOpEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToNoOp: string, channel: string) {
        this.linkUCService.findOne(channel, userId)
        .then((link) => {
            if (link == null || !link.isOp)
                client.emit('notice', 'You cannot.');
            else
                this.linkUCService.findOne(channel, userToNoOp)
                .then((found) => {
                    if (found == null)
                        client.emit('notice', "user not in channel");
                    else if (!found.isOp)
                        client.emit('notice', "this user is already not operator to this channel");
                    else {
                        this.linkUCService.doUserNoOp(channel, userToNoOp);
                        this.channelService.downgradeOpByName(channel)
                        .then(() => {
                            this.channelService.getOneByName(channel)
                            .then((exist) => {
                                if (exist == null) {
                                    this.linkUCService.deleteChannel(channel);
                                    this.messageService.deleteChannel(channel);
                                    let user = roomHandler.userMap.get(userToNoOp);
                                    if (user != undefined) {
                                        this.listMyChannelEvent(user.socket, userToNoOp);
                                        if (user.isChannel && user.room == channel) {
                                            roomHandler.joinRoom(userToNoOp, 'general', true, false, false);
                                            this.goBackToGeneral(user.socket);
                                        }
                                    }
                                }
                                else
                                    roomHandler.userMap.userBecomeNoOp(userToNoOp, channel);
                            })
                        });
                    }
                })
        })
    }

    public kickUserEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToKick: string, channel: string) {
        if (userToKick == undefined || channel == undefined)
        {
            client.emit('notice', "no comprendo the requete");
            return;
        }
        this.linkUCService.findOne(channel, userId)
        .then( (found) => {
            if (found == null || !found.isOp)
                client.emit('notice', "You can't do that.");
            else 
                this.linkUCService.findOne(channel, userToKick)
                .then( (kicked) => {
                    if (kicked == null)
                        client.emit('notice', "user not in channel");
                    else {
                        this.delUserFromChannel(userToKick, channel, roomHandler, kicked);
                    }
                })
        })
    }

    public createChannelEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, channel: ChannelEntity) {
        logger.debug('create channel request');
        console.log(channel);
        if (channel.name == 'general') {
            client.emit('notice', 'This channel already exists.');
        }
        this.channelService.getOneByName(channel.name)
        .then( (exist) => {
            if (exist == null) {
                channel.opNumber = 1;
                this.channelService.create(channel)
                .then( (succeed) => {
                    client.emit('channelCreated', succeed.name);
                    if (!succeed.hidden) {
                        this.channelService.listChannels().then( (list) => {
                            let strs: {channelName: string, password: boolean}[] = [];
                            for (let l of list) {
                                strs.push({channelName: l.name, password: l.password});}
                            roomHandler.userMap.emitExcept('listChannel', userId, strs);
                        })
                    }
                    this.linkUCService.create(this.linkUCEntityfier(userId, succeed.name, true))
                    .then( () => {
                        this.linkUCService.findAllByUserName(userId).then( (result) => {
                            logger.debug(`list of channel joined by ${userId} : `);
                            console.log(result)});
                        this.listMyChannelEvent(client, userId);
                        this.changeLocEvent(client, userId, channel.name, true, roomHandler);
                        });
                })
            }
            else
                client.emit("notice", "This channel already exists.");
        })
    }
}
