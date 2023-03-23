import { Injectable, Logger } from "@nestjs/common";
import { Socket, Namespace } from "socket.io";
import { IChannel, IMessageChat } from "./chat.interface";
import { MessageEntity } from "./message/message.entity";
import { LinkUCEntity } from "./link_users_channels/linkUC.entity";
import { ChannelEntity } from "./channel/channel.entity";
import { MessageService } from "./message/message.service";
import { ChannelService } from "./channel/channel.service";
import { LinkUCService } from "./link_users_channels/linkUC.service";
import { UserService } from "../user/user.service";
import { UserRoomHandler } from "./chat.classes";
import { UserDto } from "src/user/user.dto";

@Injectable({})
export class ChatService {
    constructor (
        private messageService: MessageService,
        private channelService: ChannelService,
        private linkUCService: LinkUCService,
        private userService: UserService
    ) {}

    private messageEntityfier(userIdId: string, data: IMessageChat): MessageEntity {
        return {
            id: undefined,
            roomId: data.room,
            isChannel: data.isChannel,
            senderId: userIdId,
            content: data.content,
            date: undefined
        };
    }

    private channelEntityfier(channProperties: IChannel): ChannelEntity {
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
            hidden: channProperties.hidden
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
            hidden: false
        }
        client.emit('newLocChannel', locGeneral, false, []);
    }

    private linkUCEntityfier(userId: string, channelId: string, op: boolean): LinkUCEntity {
        return {
            id: undefined,
            userId: userId,
            channelId: channelId,
            date: undefined,
            isOp: op
        };
    }

    private channInUCList(channEnt: ChannelEntity, UCList: LinkUCEntity[]): boolean {
        for (let l of UCList) {
            if (l.channelId == channEnt.id)
                return true;
        }
        return false;
    }

    private async delUserFromChannel(userId: string, channelId: string, roomHandler: UserRoomHandler) {
        this.channelService.delUser(userId, channelId);
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

    public connectEvent(client: Socket, user: UserDto, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.set(user.id, client);
        roomHandler.addUser(user.id, client, "general", false, true, false, false);
        client.emit("changeLocChannel", "general", []);
        chatNamespace.sockets.forEach( (socket) => {
            socket.emit('userConnected', {userId: user.id, userLogin: user.login});
        })
        logger.log(`${user.login} as id : ${user.id} is connected, ${client.id}`);
    }

    public disconnectEvent(client: Socket, userId: string, chatNamespace: Namespace, roomHandler: UserRoomHandler, logger: Logger) {
        chatNamespace.sockets.delete(userId);
        let room = roomHandler.delUser(userId);
        if (room != undefined)
            roomHandler.roomMap.of(room).emit('notice', userId, " just disconnect");
        chatNamespace.sockets.forEach( (socket) => {
            socket.emit('userDisconnected', userId);
        })
        logger.log(`${userId} is disconnected`);
    }

    public newMessageEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, message: string) {
        logger.debug(`${userId} send : `);
        console.log(message);
        let room = roomHandler.userMap.get(userId);
        if (room != undefined) {
            let toSend = {date: new Date(), sender: userId, content: message};
            if (room.isChannel) {
                if (!room.onlyOpCanTalk || room.isOP) {
                    this.messageService.create(this.messageEntityfier(userId, {room: room.room, isChannel: room.isChannel, content: message}));
                    roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
                }
                else
                    client.emit('notice', 'only channel operator can talk in this channel');
            }
            else {
                this.messageService.create(this.messageEntityfier(userId, {room: room.room, isChannel: room.isChannel, content: message}));
                client.emit('selfMessage', toSend);
                let connected = false;
                let dest = roomHandler.userMap.get(room.room);
                if (dest != undefined)
                    connected = true;
                client.emit('checkNewDM', room.room, connected);
                if (dest != undefined) {
                    dest.socket.emit('checkNewDM', userId, true);
                    if (!dest.isChannel && dest.room == userId)
                        dest.socket.emit("newMessage", toSend);
                    else
                        dest.socket.emit("pingedBy", userId);
                }
            }
        }
        else
            client.emit('notice', 'You are nowhere');
    }

    public changeLocEvent(client: Socket, userId: string, loc: string, isChannel: boolean, roomHandler: UserRoomHandler) {
        if (isChannel)
        {
            if (loc == 'general') {
                roomHandler.joinRoom(userId, loc, true, false, false);
                this.goBackToGeneral(client);
                return;
            }
            else {
                this.channelService.getOneByName(loc)
                .then(
                    (loc) => {
                        if (loc != null)
                        {
                            this.linkUCService.findOne(loc.name, userId)
                            .then(
                                (found) => {
                                    if (found != null)
                                    {
                                        roomHandler.joinRoom(userId, found.channelName, true, found.isOp, loc.onlyOpCanTalk);
                                        this.messageService.findByChannel(found.channelName)
                                        .then(
                                            ( (messages) => {
                                                client.emit('newLocChannel', loc, found.isOp, messages);
                                            }
                                        ))
                                    }
                                    else
                                        client.emit('notice', 'error: you need to join the channel');
                                }
                            )
                        }
                        else
                            client.emit('notice', 'error', 'noSuchChannel');
                    }
                )
            }
        }
        else
        {
            this.userService.findByuserId(loc)
            .then (
                (found) => {
                    if (found != null) {
                        roomHandler.joinRoom(userId, found.userId, false, false, false);
                        console.log('user currently in room : ', roomHandler.userMap.get(userId).room, roomHandler.userMap.get(userId).isChannel)
                        this.messageService.findByPrivate(userId, found.userId)
                        .then (
                            (messages) => {
                                console.log('newlocprivate send');
                                client.emit('newLocPrivate', found.userId, messages);
                            }
                        )
                    }
                    else
                        client.emit('notice', 'error', 'noSuchUser');
                }
            )
        }
    }

    public listChannelEvent(client: Socket, userId: string) {
        this.linkUCService.findAllByUserName(userId)
        .then(
            (notToDisplay) => {
                this.channelService.listChannels()
                .then (
                    (list) => {
                        let strs: {channelName: string, password: boolean}[] = [];
                        for (let l of list)
                        {
                            if (!l.hidden && !this.channInUCList(l, notToDisplay))
                                strs.push({channelName: l.name, password: l.password});
                        }
                        console.log(strs)
                        client.emit('listChannel', strs);
                    }
                )
            }
        )
    }

    public listMyChannelEvent(client: Socket, userId: string) {
        this.linkUCService.findAllByUserName(userId)
        .then(
            (list) => {
                let strs: string[] = ["general"];
                for (let l of list)
                    strs.push(l.channelName);
                client.emit('listMyChannels', strs);
            }
        )
    }

    public listMyDMEvent(client: Socket, userId: string, roomHandler: UserRoomHandler) {
        this.messageService.findAllDialogByUserName(userId)
        .then((raws) => {
            let sorted = new Map<string, boolean>();
            for (let raw of raws) {
                let user;
                if (raw.room != userId || raw.room == raw.sender)
                    user = raw.room;
                else
                    user = raw.sender;
                let connected = roomHandler.userMap.get(user);
                if (connected != undefined)
                    sorted.set(user, true);
                else
                    sorted.set(user, false);
            }
            let arrayDM: {userId: string, connected: boolean}[] = [];
            sorted.forEach((connected, userId) => arrayDM.push({userId: userId, connected: connected}));
            client.emit('listMyDM', arrayDM);
        })
    }

    public listUsersInChannel(client: Socket, channel: string) {
        this.linkUCService.findAllByChannelName(channel)
        .then((list) => {
            let users: string[] = [];
            for (let l of list) {
                users.push(l.userName);}
            client.emit('listUsersChann', users);
        })
    }

    public joinChannelEvent(client: Socket, userId: string, data: {channelName: string, channelPass: string}, roomHandler: UserRoomHandler) {
        this.linkUCService.findOne(data.channelName, userId)
        .then ( (exist) => {
            if (exist != null)
                client.emit('notice', 'already in channel');
            else {
                this.channelService.getOneByName(data.channelName)
                .then ( (chan) => {
                    if (chan != null) {
                        if (!chan.inviteOnly) {
                            if (!chan.password || data.channelPass == chan.channelPass) {
                                this.linkUCService.create(this.linkUCEntityfier(userId, data.channelName, false))
                                .then( () => { this.listMyChannelEvent(client, userId);
                                    this.changeLocEvent(client, userId, data.channelName, true, roomHandler);
                                });
                            }
                            else
                                client.emit('notice', 'Wrong channel password');
                        }
                        else
                            client.emit('notice', 'this channel is on invite only');
                    }
                    else
                        client.emit('notice', 'no such channel');
                })
            }
        })
    }

    public inviteUserEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToInvite: string, channel: string) {
        this.linkUCService.findOne(channel, userId)
        .then( (found) => {
            if (found != null) {
                if (found.isOp) {
                    this.userService.findByuserId(userToInvite)
                    .then( (attitude) => {
                        if (attitude != null) {
                            this.linkUCService.create(this.linkUCEntityfier(userToInvite, channel, false))
                            .then( () => {
                                let logged = roomHandler.userMap.get(userToInvite);
                                if (logged != undefined)
                                    this.listMyChannelEvent(logged.socket, userToInvite);
                            });
                        }
                        else
                            client.emit('notice', `The user ${userToInvite} doesn't exists`);
                    })
                }
                else {
                    this.channelService.getOneByName(channel)
                    .then( (chanOpts) => {
                        if (chanOpts.inviteOnly)
                            client.emit('notice', 'only channel operators can invite to this channel');
                        else {
                            this.userService.findByuserId(userToInvite)
                            .then( (attitude) => {
                                if (attitude != null) {
                                   this.linkUCService.create(this.linkUCEntityfier(userToInvite, channel, false))
                                    .then( () => {
                                        let logged = roomHandler.userMap.get(userToInvite);
                                        if (logged != undefined)
                                            this.listMyChannelEvent(logged.socket, userToInvite);
                                    });
                                }
                                else
                                    client.emit('notice', `The user ${userToInvite} doesn't exists`);
                            })
                        }
                    })
                }
            }
            else {
                client.emit('notice', 'You not belong to this channel');
            }
        })
    }

    public leaveChannelEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, channel: string) {
        logger.debug('leave channel request');
        this.linkUCService.findOne(channel, userId)
        .then( (found) => {
            if (found != null) {
                this.delUserFromChannel(userId, channel, roomHandler, found);
            }
            else
                client.emit('notice', 'you are not registered to that channel');
        })
    }

    public makeHimOpEvent(client: Socket, userId: string, roomHandler: UserRoomHandler, logger: Logger, userToOp: string, channel: string) {
        this.linkUCService.findOne(channel, userId)
        .then((link) => {
            if (link == null || !link.isOp)
                client.emit('notice', 'You cannot.');
            else
                this.linkUCService.findOne(channel, userToOp)
                .then((found) => {
                    if (found == null)
                        client.emit('notice', "user not in channel");
                    else if (found.isOp)
                        client.emit('notice', "this user is already operator to this channel");
                    else {
                        this.linkUCService.doUserOp(channel, userToOp);
                        this.channelService.upgradeOpByName(channel);
                        roomHandler.userMap.userBecomeOp(userToOp, channel);
                    }
                })
        })
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
