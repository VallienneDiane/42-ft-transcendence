import { Injectable, Logger } from "@nestjs/common";
import { Socket, Namespace } from "socket.io";
import { IChannelToEmit, IMessageToSend, IUserToEmit } from "./chat.interface";
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
import { createChannelDto, modifyChannelDto } from "./chat.gateway.dto";

@Injectable({})
export class ChatService {
    constructor (
        private messageChannelService: MessageChannelService,
        private messagePrivateService: MessagePrivateService,
        private channelService: ChannelService,
        private userService: UserService
    ) {}

    private goBackToGeneral(client: Socket) {
        let locGeneral: ChannelEntity = {
            id: "00000000-0000-0000-0000-000000000000",
            name: "general",
            date: new Date(),
            password: false,
            channelPass: null,
            inviteOnly: false,
            hidden: false,
            normalUsers: [],
            opUsers: [],
            godUser: undefined,
            messages: []
        }
        client.emit('newLocChannel', {channel: locGeneral, status: "normal"}, []);
    }

    private async delUserFromChannel(userId: string, channelId: string, roomHandler: UserRoomHandler) {
        await this.channelService.delUser(userId, channelId);
        let room = roomHandler.roomMap.of(channelId)
        if (room != undefined)
            room.emit("userLeaveChannel", userId);
        let socketMap = roomHandler.userMap.get(userId);
        if (socketMap != undefined) {
            let channel: IChannelToEmit = await this.channelService.getOneById(channelId);
            socketMap.sockets.forEach((user, socket) => {
                socket.emit("channelLeaved", channel);
                if (user.isChannel && user.room == channelId) {
                    roomHandler.joinRoom(userId, socket, '00000000-0000-0000-0000-000000000000', true, false, false);
                    this.goBackToGeneral(socket);
                }
            });
        }
    }

    public connectEvent(client: Socket, user: UserEntity, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.set(user.id, client);
        let newUser = roomHandler.addUser(user.id, client, "general", true, false, false, false);
        client.emit("changeLocChannel", "general", []);
        if (newUser) {
            chatNamespace.sockets.forEach( (socket) => {
                socket.emit('userConnected', {userId: user.id, userLogin: user.login});
            })
            logger.log(`${user.login} as id : ${user.id} is connected, ${client.id}`);
        }
    }

    public disconnectEvent(client: Socket, user: UserEntity, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.delete(user.id);
        if (roomHandler.delSocket(client)) {
            chatNamespace.sockets.forEach( (socket) => {
                socket.emit('userDisconnected', {userId: user.id, userLogin: user.login});
            })
            logger.log(`${user.login} as id ${user.id} is disconnected`);
        }
    }

    public newMessageEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, message: string) {
        logger.debug(`${user.login} send : ${message}`);
        let room = roomHandler.socketMap.sockets.get(client);
        if (room != undefined) {
            let toSend: IMessageToSend = {date: new Date(), senderId: user.id, senderName: user.login, content: message};
            if (room.isChannel) {
                    if (room.room != "general") {
                        logger.debug(`${message} to stock in ${room.room}`);
                        this.channelService.getOneById(room.room)
                        .then((channId) => {
                            this.messageChannelService.addMessage(user, channId, message);
                        })
                    roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
                }
                else
                    client.emit('notice', 'only channel operator can talk in this channel');
            }
            else {
                this.userService.findById(room.room)
                .then((dest) => {
                    this.messagePrivateService.sendPrivateMessage(user, dest, message);
                });
                let senderSockets = roomHandler.userMap.get(user.id);
                if (senderSockets != undefined) {
                    senderSockets.sockets.forEach((data, socket) => {
                        if (!data.isChannel && data.room == room.room)
                            socket.emit('selfMessage', toSend);
                    })
                }
                let dest = roomHandler.userMap.get(room.room);
                let connected = dest != undefined;
                this.userService.findById(room.room)
                .then(
                    (user) => {
                        client.emit('checkNewDM', {id: room.room, login: user.login}, connected);
                    }
                )
                if (connected) {
                    let userToEmit: IUserToEmit = user;
                    dest.emit('checkNewDM', userToEmit, true);
                    dest.sockets.forEach((data, socket) => {
                        if (!data.isChannel && data.room == user.id)
                            socket.emit("newMessage", toSend);
                        else
                            socket.emit("pingedBy", userToEmit);
                    })
                }
            }
        }
        else
            client.emit('notice', 'You are nowhere');
    }

    public changeLocEvent(client: Socket, user: UserEntity, loc: string, isChannel: boolean, roomHandler: UserRoomHandler) {
        if (isChannel)
        {
            if (loc == '00000000-0000-0000-0000-000000000000') {
                roomHandler.joinRoom(user.id, client, loc, true, false, false);
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
                                client,
                                loc,
                                true,
                                found.status == "god",
                                found.status == "op");
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
                        roomHandler.joinRoom(user.id, client, found.id, false, false, false);
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

    async listChannelEvent(client: Socket, userId: string) {
        let channelsArray: IChannelToEmit[] = await this.channelService.listChannelsWhereUserIsNot(userId);
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
        this.messagePrivateService.listDM(user)
            .then(
                (array) => {
                    let arrayToEmit: {userName: string, userId: string, connected: boolean}[] = [];
                    for (let elt of array) {
                        let argie = roomHandler.userMap.get(elt.id);
                        if (argie != undefined)
                            arrayToEmit.push({userId: elt.id, userName: elt.login, connected: true});
                        else
                            arrayToEmit.push({userId: elt.id, userName: elt.login, connected: false});
                    }
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
        let usersArray: {user: IUserToEmit, status: string, connected: boolean}[] = [];
        const rawArray = await this.channelService.listUsersInChannel(channelId, true);
        for (let elt of rawArray) {
            usersArray.push({
                user: {
                    id: elt.user.id,
                    login: elt.user.login
                },
                status: elt.status,
                connected: roomHandler.userMap.get(elt.user.id) != undefined
            })
        client.emit("listUsersChann", usersArray);
        }
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
                                                let room = roomHandler.roomMap.of(channel.id);
                                                if (room != undefined) {
                                                    room.emit("newUserInChannel", user.id, user.login, true);
                                                }
                                                let channelToEmit: IChannelToEmit = channel;
                                                roomHandler.emitToUserHavingThisSocket(client, "channelJoined", {channel: channelToEmit, status: "normal"});
                                                this.changeLocEvent(client, user, data.channelId, true, roomHandler);
                                                if (channel.password)
                                                    client.emit("correctPassword");
                                            })
                                    }
                                    else
                                        client.emit("incorrectPassword");
                                        // client.emit("notice", "Wrong password");
                                }
                                else
                                    client.emit("notice", "This channel is on invite only");
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
                                            let room = roomHandler.roomMap.of(channelId);
                                            if (room != undefined)
                                                room.emit("newUserInChannel", userEntity.id, userEntity.login);
                                            let logged = roomHandler.userMap.get(userToInvite);
                                            if (logged != undefined) {
                                                this.channelService.getOneById(channelId)
                                                .then((channelEntity) => {
                                                    let channelToEmit: IChannelToEmit = channelEntity;
                                                    logged.sockets.forEach(({}, socket) => {
                                                        socket.emit("channelJoined", {channel: channelToEmit, status: "normal"});
                                                    })
                                                })
                                            }
                                        })
                                    }
                                    else
                                        client.emit("notice", `The user ${userEntity.login} already belong to this channel.`);
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
                                                        let room = roomHandler.roomMap.of(channelId);
                                                        if (room != undefined)
                                                            room.emit("newUserInChannel", userEntity.id, userEntity.login);
                                                        let logged = roomHandler.userMap.get(userToInvite);
                                                        if (logged != undefined) {
                                                            let channelToEmit: IChannelToEmit = chanOpts;
                                                            logged.sockets.forEach(({}, socket) => {
                                                                socket.emit("channelJoined", {channel: channelToEmit, status: "normal"});
                                                            })
                                                        }
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
                            else if (linkToOp.status != "normal")
                                client.emit('notice', "this user is already operator to this channel");
                            else {
                                this.channelService.upgradeUserOnChannel(linkToOp.user, channelId)
                                .then(() => {
                                    roomHandler.userMap.userBecomeOp(userToOp, channelId);
                                })
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
                            inviteOnly: channel.inviteOnly,
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
                                    roomHandler.socketMap.sockets.forEach(
                                        (data, socket) => {
                                            if (data.userId != user.id)
                                                this.userService.findById(data.userId)
                                                .then(
                                                    (userEntity) => {
                                                        this.listChannelEvent(socket, userEntity.id);
                                                    });
                                        });
                                }
                                this.listMyChannelEvent(client, user.id);
                                this.changeLocEvent(client, user, succeed.id, true, roomHandler);
                            });
                    }
                    else
                        client.emit("notice", "This channel already exists.");
                });
        }
    }

    public modifyChannelEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, data: modifyChannelDto) {
        if (data.password && data.channelPass == "")
            client.emit("notice", "You can't set an empty pass.");
        else {
            this.channelService.getUserInChannel(data.id, user.id)
            .then((link) => {
                if (!link || link.status != "god")
                    client.emit("notice", "You can't do that");
                else {
                    this.channelService.updateById(data.id, data).then(() =>
                        roomHandler.socketMap.sockets.forEach((user, socket) => {
                            this.listChannelEvent(socket, user.userId);
                        })
                    )
                }
            })
        }
    }

    public destroyChannelEvent(client: Socket, user: UserEntity, channelId: string, roomHandler: UserRoomHandler) {
        this.channelService.getUserInChannel(channelId, user.id)
        .then((link) => {
            if (!link || link.status != "god")
                client.emit("notice", "You can't do that !");
            else {
                this.channelService.deleteById(channelId)
                .then(() => {
                    roomHandler.roomKill(channelId);
                })
            }
        })
    }
}
