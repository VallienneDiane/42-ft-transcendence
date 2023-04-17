import { Injectable, Logger } from "@nestjs/common";
import { Socket, Namespace } from "socket.io";
import * as bcrypt from 'bcrypt';
import { IChannelToEmit, IMessageToSend, IUserToEmit } from "./chat.interface";
import { MessageChannelService } from "./messageChannel/messageChannel.service";
import { MessagePrivateService } from "./messagePrivate/messagePrivate.service";
import { ChannelEntity } from "./channel/channel.entity";
import { ChannelService } from "./channel/channel.service";
import { UserService } from "../user/user.service";
import { UserRoomHandler } from "./chat.classes";
import { UserEntity } from "src/user/user.entity";
import { createChannelDto, modifyChannelDto } from "./chat.gateway.dto";
import { FriendService } from "./relation/friend/friend.service";
import { FriendEntity } from "./relation/friend/friend.entity";
import { MuteService } from "./mute/mute.service";

@Injectable({})
export class ChatService {
    constructor (
        private messageChannelService: MessageChannelService,
        private messagePrivateService: MessagePrivateService,
        private channelService: ChannelService,
        private userService: UserService,
        private friendService: FriendService,
        private muteService: MuteService
    ) {}

    private retypeAsId(entity : any): string {
        return entity.userId;
    } 

    private goBackToGeneral(client: Socket) {
        let locGeneral: ChannelEntity = {
            id: "00000000-0000-0000-0000-000000000000",
            name: "general",
            date: new Date(),
            password: false,
            channelPass: null,
            inviteOnly: false,
            normalUsers: [],
            opUsers: [],
            godUser: undefined,
            bannedUsers: [],
            usersMuted: [],
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
                    roomHandler.joinRoom(userId, socket, "00000000-0000-0000-0000-000000000000", true, false, false);
                    this.goBackToGeneral(socket);
                }
            });
        }
    }

    public connectEvent(client: Socket, user: UserEntity, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.set(user.id, client);
        let newUser = roomHandler.addUser(user.id, client, "00000000-0000-0000-0000-000000000000", true, false, false, false);
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

    public whereIamEvent(client: Socket, userId: string, roomHandler: UserRoomHandler) {
        let room = roomHandler.socketMap.sockets.get(client);
        console.log("room: ", room);
        if (room != undefined) {
            if (room.isChannel) {
                if (room.room == "00000000-0000-0000-0000-000000000000")
                    this.goBackToGeneral(client);
                else {
                    this.userService.getChannelLink(userId, room.room)
                    .then((link) => {
                        if (link) {
                            this.channelService.getMessages(room.room)
                            .then((messages) => {
                                client.emit("newLocChannel", link, messages);
                            })
                        }
                    })
                }
            }
            else {
                this.userService.findById(room.room)
                .then((other) => {
                    if (other) {
                        this.messagePrivateService.findConversation(userId, room.room)
                        .then((messages) => {
                            client.emit("newLocPrivate", other.id, other.login, messages);
                        })
                    }
                })
            }
        }
    }

    public newMessageEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, message: string) {
        logger.debug(`${user.login} send : ${message}`);
        let room = roomHandler.socketMap.sockets.get(client);
        if (room != undefined) {
            let toSend: IMessageToSend = {date: new Date(), senderId: user.id, senderName: user.login, content: message};
            if (room.isChannel) {
                    if (room.room != "00000000-0000-0000-0000-000000000000") {
                        logger.debug(`${message} to stock in ${room.room}`);
                        this.channelService.getOneById(room.room)
                        .then((channId) => {
                            this.muteService.findMuteRelation(user.id, room.room)
                            .then((muted) => {
                                if (!muted) {
                                    this.messageChannelService.addMessage(user, channId, message)
                                    .then(() => {
                                        roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
                                    });
                                }
                                else
                                    client.emit("notice", "You has been muted!!");
                            })
                        })}
                    else
                        roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
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

    public changeLocEvent(client: Socket, userId: string, loc: string, isChannel: boolean, roomHandler: UserRoomHandler) {
        if (isChannel)
        {
            if (loc == '00000000-0000-0000-0000-000000000000') {
                roomHandler.joinRoom(userId, client, loc, true, false, false);
                this.goBackToGeneral(client);
                return;
            }
            else {
                this.userService.getChannelLink(userId, loc)
                .then(
                    (found) => {
                        if (found) {
                            roomHandler.joinRoom(
                                userId,
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
                        roomHandler.joinRoom(userId, client, found.id, false, false, false);
                        this.messagePrivateService.findConversation(userId, found.id)
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
                    this.channelService.findUserInBannedList(user.id, data.channelId)
                    .then((banned) => {
                        if (banned)
                            client.emit("notice", "You were banned from this channel");
                        else {
                            this.channelService.getOneById(data.channelId)
                                .then((channel) => {
                                    if (channel != null) {
                                        if (!channel.inviteOnly) {
                                            if (channel.password === true) {
                                                bcrypt.compare(data.channelPass, channel.channelPass)
                                                .then((ok: boolean) => {
                                                    if (ok) {
                                                        this.channelService.addNormalUser(user, channel.id)
                                                        .then(() => {
                                                            let room = roomHandler.roomMap.of(channel.id);
                                                            if (room != undefined) {
                                                                room.emit("newUserInChannel", user.id, user.login, true);
                                                            }
                                                            let channelToEmit: IChannelToEmit = channel;
                                                            roomHandler.emitToUserHavingThisSocket(client, "channelJoined", {channel: channelToEmit, status: "normal"});
                                                            this.changeLocEvent(client, user.id, data.channelId, true, roomHandler);
                                                            client.emit("correctPassword");
                                                        })
                                                    }
                                                    else
                                                        client.emit("incorrectPassword");
                                                })
                                            }
                                            else {
                                                this.channelService.addNormalUser(user, channel.id)
                                                .then(() => {
                                                    let room = roomHandler.roomMap.of(channel.id);
                                                    if (room != undefined) {
                                                        room.emit("newUserInChannel", user.id, user.login, true);
                                                    }
                                                    let channelToEmit: IChannelToEmit = channel;
                                                    roomHandler.emitToUserHavingThisSocket(client, "channelJoined", {channel: channelToEmit, status: "normal"});
                                                    this.changeLocEvent(client, user.id, data.channelId, true, roomHandler);
                                                })
                                            }
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
            })
    }

    public inviteUserEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToInvite: string, channelId: string) {
        this.channelService.getUserInChannel(channelId, userId)
        .then((found) => {
            if (found != null) {
                if (found.status != "normal") {
                    this.userService.findByLogin(userToInvite)
                    .then((userEntity) => {
                        if (userEntity != null) {
                            this.channelService.findUserInBannedList(userEntity.id, channelId)
                            .then((banned) => {
                                if (banned)
                                    client.emit("notice", `The user "${userEntity.login}" is banned here.`);
                                else {
                                    this.channelService.getUserInChannel(channelId, userEntity.id)
                                    .then(
                                        (alreadyHere) => {
                                            if (alreadyHere == null) {
                                                this.channelService.addNormalUser(userEntity, channelId)
                                                .then( () => {
                                                    let room = roomHandler.roomMap.of(channelId);
                                                    if (room != undefined)
                                                        room.emit("newUserInChannel", userEntity.id, userEntity.login);
                                                    let logged = roomHandler.userMap.get(userEntity.id);
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
                            })
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
                                this.userService.findByLogin(userToInvite)
                                .then((userEntity) => {
                                    if (userEntity != null) {
                                        this.channelService.findUserInBannedList(userEntity.id, channelId)
                                        .then((banned) => {
                                            if (banned)
                                                client.emit("notice", `The user "${userEntity.login}" is banned here.`);
                                            else {
                                                this.channelService.getUserInChannel(channelId, userEntity.id)
                                                .then(
                                                    (alreadyHere) => {
                                                        if (alreadyHere == null) {
                                                            this.channelService.addNormalUser(userEntity, channelId)
                                                            .then( () => {
                                                                let room = roomHandler.roomMap.of(channelId);
                                                                if (room != undefined)
                                                                    room.emit("newUserInChannel", userEntity.id, userEntity.login);
                                                                let logged = roomHandler.userMap.get(userEntity.id);
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
                                        })
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
                console.log(link);
                if (!link || link.status != "god") {
                    client.emit("notice", "You cannot.");
                }
                else {
                    this.channelService.getUserInChannel(channelId, userToOp)
                    .then(
                        (linkToOp) => {
                            console.log(linkToOp);
                            if (!linkToOp)
                                client.emit("notice", "user not in channel");
                            else if (linkToOp.status != "normal")
                                client.emit('notice', "this user is already operator to this channel");
                            else {
                                this.channelService.upgradeUserOnChannel(linkToOp.user, channelId)
                                .then(() => {
                                    roomHandler.userMap.userBecomeOp(userToOp, channelId);
                                    let room = roomHandler.roomMap.of(channelId);
                                    if (room != undefined) {
                                        room.c.forEach(socket => {
                                            let userSocket = roomHandler.socketMap.sockets.get(socket);
                                            if (userSocket != undefined && userSocket.userId == userToOp)
                                                this.changeLocEvent(socket, userToOp, channelId, true, roomHandler);
                                            this.listUsersInChannel(socket, channelId, roomHandler);
                                        })
                                    }
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
                                this.channelService.downgradeUserOnChannel(linkToDeOp.user, channelId)
                                .then(() => {
                                        roomHandler.userMap.userBecomeNoOp(userToNoOp, channelId);
                                        let room = roomHandler.roomMap.of(channelId);
                                        if (room != undefined) {
                                            room.c.forEach(socket => {
                                                let userSocket = roomHandler.socketMap.sockets.get(socket);
                                                if (userSocket != undefined && userSocket.userId == userToNoOp)
                                                    this.changeLocEvent(socket, userToNoOp, channelId, true, roomHandler);
                                                this.listUsersInChannel(socket, channelId, roomHandler);
                                            })
                                        }
                                    }
                                )
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

    async createChannelEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, channel: createChannelDto) {
        if (channel.name == 'general') {
            client.emit("notice", "This channel already exists.");
        }
        else {
            this.channelService.getOneByName(channel.name)
            .then(
                (exist) => {
                    if (!exist) {
                        const newChannel: ChannelEntity = {
                            id: undefined,
                            date: undefined,
                            name: channel.name,
                            password: channel.password,
                            channelPass: "",
                            inviteOnly: channel.inviteOnly,
                            messages: [],
                            normalUsers: [],
                            opUsers: [],
                            bannedUsers: [],
                            usersMuted: [],
                            godUser: user
                        };
                        if (channel.password === true) {
                            const saltOrRounds = 10;
                            bcrypt.hash(channel.channelPass, saltOrRounds)
                            .then((hash: string) => {
                                newChannel.channelPass = hash;
                                this.channelService.create(newChannel)
                                .then(
                                    (succeed) => {
                                        if (!succeed.inviteOnly)
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
                                        this.changeLocEvent(client, user.id, succeed.id, true, roomHandler);
                                });
                            })
                        }
                        else {
                            this.channelService.create(newChannel)
                            .then(
                                (succeed) => {
                                    if (!succeed.inviteOnly)
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
                                    this.changeLocEvent(client, user.id, succeed.id, true, roomHandler);
                            });
                        }
                    }
                    else
                        client.emit("notice", "This channel already exists.");
            });
        }
    }

    async modifyChannelEvent(client: Socket, user: UserEntity, roomHandler: UserRoomHandler, logger: Logger, data: modifyChannelDto) {
        if (data.password && data.channelPass == "")
            client.emit("notice", "You can't set an empty pass.");
        else {
            this.channelService.getUserInChannel(data.id, user.id)
            .then((link) => {
                if (!link || link.status != "god")
                    client.emit("notice", "You can't do that");
                else {
                    if (data.password === true) {
                        const saltOrRounds = 10;
                        bcrypt.hash(data.channelPass, saltOrRounds)
                        .then((hash: string) => {
                            const updateChannel: modifyChannelDto = {
                                id: data.id,
                                name: data.name,
                                password: data.password,
                                channelPass: hash,
                                inviteOnly: data.inviteOnly,
                            };
                            this.channelService.updateById(data.id, updateChannel).then(() =>
                                roomHandler.socketMap.sockets.forEach((user, socket) => {
                                    this.listChannelEvent(socket, user.userId);
                                })
                            )
                        })
                    }
                    else {
                        this.channelService.updateById(data.id, data).then(() =>
                            roomHandler.socketMap.sockets.forEach((user, socket) => {
                                this.listChannelEvent(socket, user.userId);
                            })
                        )
                    }
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

    public friendRequestEvent(client: Socket, sender: UserEntity, receiverId: string, roomHandler: UserRoomHandler) {
        this.friendService.checkRequest(sender.id, receiverId)
        .then((check: boolean) => {
            if (check) {
                this.userService.findById(receiverId)
                .then((receiver: UserEntity) => {
                    this.friendService.create(sender, receiver)
                    .then((friendship: FriendEntity) => {
                        let senderSockets = roomHandler.userMap.get(sender.id);
                        if (senderSockets != undefined) {
                            senderSockets.emit("notice", "Your request has been sent.");
                            senderSockets.emit("newFriendRequestSent", friendship.id, receiver.id, receiver.login);
                        }
                        // roomHandler.emitToUserHavingThisSocket(client, "notice", "Your request has been sent.");
                        let receiverSockets = roomHandler.userMap.get(receiver.id);
                        if (receiverSockets != undefined)
                            receiverSockets.emit("newFriendRequestReceived", friendship.id, sender.id, receiver.login);
                    })
                })
            }
            else 
                client.emit("notice", "You've already sent a request to this user ! Or it's your friend...")
        })
    }

    public acceptFriendRequestEvent(friendshipId: string, roomHandler: UserRoomHandler) {
        this.friendService.findById(friendshipId)
        .then((request: FriendEntity) => {
            console.log("request = ", request);
            this.friendService.updateRequest(request.id)
            .then(() => {
                let receiverSockets = roomHandler.userMap.get(request.receiver.id);
                if (receiverSockets != undefined)
                    receiverSockets.emit("newFriend", request.id, request.sender.id, request.sender.login);
                let senderSockets = roomHandler.userMap.get(request.sender.id);
                if (senderSockets != undefined)
                    senderSockets.emit("newFriend", request.id, request.receiver.id, request.receiver.login);
            })
        })
    }

    public supressRequestEvent(friendshipId: string, roomHandler: UserRoomHandler) {
        this.friendService.findById(friendshipId)
        .then((request: FriendEntity) => {
            this.friendService.deleteRequest(request.id)
            .then(() => {
                let receiverSockets = roomHandler.userMap.get(request.receiver.id);
                if (receiverSockets != undefined)
                    receiverSockets.emit("supressFriendRequest", friendshipId);
                let senderSockets = roomHandler.userMap.get(request.sender.id);
                if (senderSockets != undefined)
                    senderSockets.emit("supressFriendRequest", friendshipId);
            })
        })
    }

    public unfriendEvent(me: UserEntity, friendshipId: string, roomHandler: UserRoomHandler) {
        this.friendService.findById(friendshipId)
        .then((request: FriendEntity) => {
            let friend: UserEntity = null;
            if (request.sender == me)
                friend = request.receiver;
            else
                friend = request.sender;
            this.friendService.deleteRequest(friendshipId)
            .then(() => {
                let meSockets = roomHandler.userMap.get(me.id);
                if (meSockets != undefined)
                    meSockets.emit("supressFriend", friendshipId);
                let friendSockets = roomHandler.userMap.get(friend.id);
                if (friendSockets != undefined)
                    friendSockets.emit("supressFriend", friendshipId);
            })
        })
    }

    public listBlockEvent(client: Socket, userId: string) {
        this.userService.getBlockList(userId)
        .then((array) => {
            client.emit("listBlock", array);
        })
    }

    public blockUserEvent(client: Socket, user: UserEntity, userIdToBlock: string, roomHandler: UserRoomHandler) {
        this.userService.findById(userIdToBlock)
        .then((found) => {
            if (found) {
                this.userService.getBlockList(user.id)
                .then((blocked) => {
                    for (let elt of blocked) {
                        if (elt.id == userIdToBlock) {
                            client.emit("notice", `You already blocked ${elt.name}.`);
                            return;
                        }
                    }
                    this.userService.addUserToBlock(user.id, userIdToBlock)
                    .then(() => {
                        this.unfriendEvent(user, userIdToBlock, roomHandler);
                        let sockets = roomHandler.userMap.get(user.id);
                        if (sockets != undefined)
                        sockets.sockets.forEach(({}, socket) => {
                            this.listBlockEvent(socket, user.id);
                        })
                    })
                })
            }
            else
                client.emit("notice", "user not found");
        })
    }

    public unblockUserEvent(client: Socket, user: UserEntity, userIdToUnblock: string, roomHandler: UserRoomHandler) {
        this.userService.findById(userIdToUnblock)
        .then((found) => {
            if (found) {
                this.userService.delUserToBlock(user.id, userIdToUnblock)
                .then(() => {
                    let sockets = roomHandler.userMap.get(user.id);
                    if (sockets != undefined)
                    sockets.sockets.forEach(({}, socket) => {
                        this.listBlockEvent(socket, user.id);
                    })
                })
            }
            else
                client.emit("notice", "user not found");
        })
    }

    public banUserEvent(client: Socket, userId: string, userIdToBan: string, channelId: string, logger: Logger, roomHandler: UserRoomHandler) {
        this.channelService.getUserInChannel(channelId, userId)
        .then((link) => {
            if (!link || link.status == "normal")
                client.emit("notice", "You can't do that!");
            else {
                this.userService.findById(userIdToBan)
                .then((userEntity) => {
                    if (!userEntity)
                        client.emit("notice", "User not found.");
                    else {
                        this.channelService.getUserInChannel(channelId, userIdToBan)
                        .then((banLink) => {
                            if (!banLink) {
                                this.channelService.findUserInBannedList(userIdToBan, channelId)
                                .then((bool) => {
                                    if (bool)
                                        client.emit("notice", "this user is already banned here.")
                                    else
                                        this.channelService.addBannedUser(userIdToBan, channelId);
                                })
                            }
                            else if (banLink.status == "normal" || (banLink.status == "op" && link.status == "god")) {
                                this.channelService.addBannedUser(userIdToBan, channelId)
                                .then(() => {
                                    this.kickUserEvent(client, userId, roomHandler, logger, userIdToBan, channelId);
                                })
                            }
                            else
                                client.emit("notice", "Only the channel owner can do that");
                        })
                    }
                })
            }
        })
    }

    public unbanUserEvent(client: Socket, userId: string, userNameToUnban: string, channelId: string, logger: Logger, roomHandler: UserRoomHandler) {
        this.channelService.getUserInChannel(channelId, userId)
        .then((link) => {
            if (!link || link.status != "god")
                client.emit("notice", "Only channel owner can unban");
            else {
                this.userService.findByLogin(userNameToUnban)
                .then((userEntity) => {
                    if (!userEntity)
                        client.emit("notice", `user "${userNameToUnban}" not found`);
                    else {
                        this.channelService.findUserInBannedList(userEntity.id, channelId)
                        .then((found) => {
                            if (!found)
                                client.emit("notice", `user "${userNameToUnban}" is not banned here.`)
                            else
                                this.channelService.delBannedUser(userEntity.id, channelId);
                        })
                    }
                })
            }
        })
    }

    public muteUserEvent(client: Socket, userId: string, userIdToMute: string, channelId: string, minutes: number) {
        this.userService.getChannelLink(userId, channelId)
        .then((link) => {
            if (!link || link.status == "normal")
                client.emit("notice", "You can't do that!");
            else {
                this.userService.getChannelLink(userIdToMute, channelId)
                .then((muteLink) => {
                    if (!muteLink)
                        client.emit("notice", "User not belong to this channel");
                    else if (muteLink.status == "normal" || (muteLink.status == "op" && link.status == "god")) {
                        this.muteService.muteUser(userIdToMute, channelId, minutes);
                    }
                    else
                        client.emit("notice", "Only the channel owner can mute operators");
                })
            }
        })
    }
    
    public listMutedUsersEvent(client: Socket, roomHandler: UserRoomHandler) {
        let room = roomHandler.socketMap.sockets.get(client);
        if (room != undefined && room.isChannel) {
            this.muteService.getCurrentMutedInChannel(room.room)
            .then((array) => {
                client.emit("mutedList", array);
            })
        }
    }
}
