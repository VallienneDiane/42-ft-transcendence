import { Injectable, Logger } from "@nestjs/common";
import { Socket } from "socket.io";
import { IChannel, IHandle, IMessageChat, IMessageToSend, IToken } from "./chat.interface";
import * as jsrsasign from 'jsrsasign';
import { MessageEntity } from "./message/message.entity";
import { LinkUCEntity } from "./link_users_channels/linkUC.entity";
import { ChannelEntity } from "./channel/channel.entity";
import { MessageService } from "./message/message.service";
import { ChannelService } from "./channel/channel.service";
import { LinkUCService } from "./link_users_channels/linkUC.service";
import { JwtService } from '@nestjs/jwt';
import { UserService } from "../user/user.service";
import { UserRoomHandler } from "./chat.classes";

@Injectable({})
export class ChatService {
    constructor (
        private messageService: MessageService,
        private channelService: ChannelService,
        private linkUCService: LinkUCService,
        private jwtService: JwtService,
        private userService: UserService
    ) {}

    private extractLogin(client: Socket): string {
        let object: IToken = jsrsasign.KJUR.jws.JWS.parse(client.handshake.auth['token']).payloadObj;
        if (object == undefined) {
            client.emit("fromServerMessage", "you're token is invalid");
            return null;
        }
        let pseudo: string = object.login;
        return pseudo;
    }

    private messageEntityfier(login: string, data: IMessageChat): MessageEntity {
        return {
            id: undefined,
            room: data.room,
            isChannel: data.isChannel,
            sender: login,
            content: data.content,
            date: undefined
        };
    }

    private channelEntityfier(channProperties: IChannel): ChannelEntity {
        return {
            id: undefined,
            date: undefined,
            name: channProperties.channelName,
            pass: channProperties.channelPass,
            opNumber: 1,
            inviteOnly: channProperties.inviteOnly,
            persistant: channProperties.persistant,
            onlyOpCanTalk: channProperties.onlyOpCanTalk,
            hidden: channProperties.hidden
        };
    }

    private linkUCEntityfier(login: string, channelName: string, op: boolean): LinkUCEntity {
        return {
            id: undefined,
            userName: login,
            channelName: channelName,
            date: undefined,
            isOp: op
        };
    }

    private channInUCList(channEnt: ChannelEntity, UCList: LinkUCEntity[]): boolean {
        for (let l of UCList) {
            if (l.channelName == channEnt.name)
                return true;
        }
        return false;
    }

    private delUserFromChannel(login: string, channel: string, roomHandler: UserRoomHandler) {
        this.linkUCService.findOne(channel, login)
        .then( (link) => {
            if (link.isOp)
                this.channelService.downgradeOpByName(channel)
                .then(() => {
                    this.channelService.getOneByName(channel)
                    .then( (exist) => {
                        if (exist == null)
                            this.messageService.deleteChannel(channel);
                    })
                });
        })
        this.linkUCService.deleteLink(channel, login);
        let room = roomHandler.userMap.get(login);
        if (room != undefined && room.isChannel && room.room == channel) {
            roomHandler.joinRoom(login, 'general', true, false, false);
            room.socket.emit('newLocChannel', 'general', []);
        }    
}

    public connectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            const decoded = this.jwtService.verify(data.client.handshake.auth['token'], {
                secret: process.env.SECRET,
            });
            console.log(decoded);
            let login = this.extractLogin(data.client);
            if (!login)
            {
                data.logger.log(`undefined token`);
                return;
            }
            this.userService.findByLogin(login)
            .then( (found) => {
                if (found != null) {
                    data.chatNamespace.sockets.set(login, data.client);
                    data.roomHandler.addUser(login, data.client, "general", true, false, false);
                    console.log(login);
                    data.client.emit("changeLocChannel", "general", []);
                    data.chatNamespace.sockets.forEach( (socket) => {
                        socket.emit('newUserConnected');
                    })
                    data.logger.log(`${login} is connected, ${data.client.id}`);
                }
                else {
                    data.logger.warn(`a socket with login ${login} is not known in database`);
                }
            })
        }
    }

    public disconnectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            let login = this.extractLogin(data.client);
            if (!login)
                return;
            data.chatNamespace.sockets.delete(login);
            let room = data.roomHandler.delUser(login);
            if (room != undefined)
                data.roomHandler.roomMap.of(room).emit('notice', login, " just disconnect");
            data.logger.log(`${login} is disconnected`);
        }
    }

    public newMessageEvent(client: Socket, roomHandler: UserRoomHandler, logger: Logger, message: string) {
        let login = this.extractLogin(client);
        if (!login)
            return;
        logger.debug(`${login} send : `);
        console.log(message);
        let room = roomHandler.userMap.get(login);
        let toSend = {date: new Date(), sender: login, content: message};
        if (room != undefined) {
            if (room.isChannel) {
                if (!room.onlyOpCanTalk || room.isOP) {
                    this.messageService.create(this.messageEntityfier(login, {room: room.room, isChannel: room.isChannel, content: message}));
                    roomHandler.roomMap.of(room.room).emit("newMessage", toSend);
                }
                else
                    client.emit('notice', 'only channel operator can talk in this channel');
            }
            else {
                this.messageService.create(this.messageEntityfier(login, {room: room.room, isChannel: room.isChannel, content: message}));
                client.emit('selfMessage', toSend);
                let dest = roomHandler.userMap.get(room.room);
                if (dest != undefined) {
                    if (!dest.isChannel && dest.room == login)
                        dest.socket.emit("newMessage", toSend);
                    else
                        dest.socket.emit("pingedBy", login);
                }
            }
        }
        else
            client.emit('notice', 'You are nowhere');
    }

    public changeLocEvent(client: Socket, loc: string, isChannel: boolean, roomHandler: UserRoomHandler) {
        let login = this.extractLogin(client);
        if (isChannel)
        {
            if (loc == 'general') {
                roomHandler.joinRoom(login, loc, true, false, false)
                client.emit('newLocChannel', 'general', []);
                return;
            }
            else {
                this.channelService.getOneByName(loc)
                .then(
                    (loc) => {
                        if (loc != null)
                        {
                            this.linkUCService.findOne(loc.name, login)
                            .then(
                                (found) => {
                                    if (found != null)
                                    {
                                        roomHandler.joinRoom(login, found.channelName, true, found.isOp, loc.onlyOpCanTalk);
                                        this.messageService.findByChannel(found.channelName)
                                        .then(
                                            ( (messages) => {
                                                client.emit('newLocChannel', found.channelName, messages);
                                            }
                                        ))
                                    }
                                    else
                                        client.emit('notice', 'error', 'notRegisteredToChannel');
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
            this.userService.findByLogin(loc)
            .then (
                (found) => {
                    if (found != null) {
                        roomHandler.joinRoom(login, found.login, false, false, false);
                        console.log('user currently in room : ', roomHandler.userMap.get(login).room, roomHandler.userMap.get(login).isChannel)
                        this.messageService.findByPrivate(login, found.login)
                        .then (
                            (messages) => {
                                console.log('newlocprivate send');
                                client.emit('newLocPrivate', found.login, messages);
                            }
                        )
                    }
                    else
                        client.emit('notice', 'error', 'noSuchUser');
                }
            )
        }
    }

    public listChannelEvent(client: Socket) {
        console.log("blop")
        let login = this.extractLogin(client);
        this.linkUCService.findAllByUserName(login)
        .then(
            (notToDisplay) => {
                this.channelService.listChannels()
                .then (
                    (list) => {
                        let strs: string[] = ["general"];
                        for (let l of list)
                        {
                            if (!l.hidden && !this.channInUCList(l, notToDisplay))
                                strs.push(l.name);
                        }
                        console.log(strs)
                        client.emit('listChannel', strs);
                    }
                )
            }
        )
    }

    public listMyChannelEvent(client: Socket) {
        let login = this.extractLogin(client);
        this.linkUCService.findAllByUserName(login)
        .then(
            (list) => {
                let strs: string[] = ["general"];
                for (let l of list)
                    strs.push(l.channelName);
                client.emit('listMyChannels', strs);
            }
        )
    }

    public joinChannelEvent(data: IHandle) {
        let login = this.extractLogin(data.client);
        this.linkUCService.findOne(data.channelEntries.channelName, login)
        .then ( (exist) => {
            if (exist != null)
                data.client.emit('alreadyInChannel');
            else {
                this.channelService.getOneByName(data.channelEntries.channelName)
                .then ( (chan) => {
                    if (chan != null) {
                        if (!chan.inviteOnly) {
                            if (chan.pass != undefined && data.channelEntries.channelPass! == chan.pass) {
                                this.linkUCService.create(this.linkUCEntityfier(login, data.channelEntries.channelName, false))
                                .then( (succeed) => data.client.emit('channelJoined', succeed.channelName));
                            }
                            else
                                data.client.emit('notice' ,'Wrong channel password');
                        }
                        else
                            data.client.emit('notice', 'this channel is on invite only');
                    }
                    else
                        data.client.emit('noSuchChannel');
                })
            }
        } )
    }

    public inviteUserEvent(client: Socket, roomHandler: UserRoomHandler, logger: Logger, userToInvite: string, channel: string) {
        let login = this.extractLogin(client);
        if (!login)
            return;
        this.linkUCService.findOne(channel, login)
        .then( (found) => {
            if (found != null) {
                if (found.isOp) {
                    this.userService.findByLogin(userToInvite)
                    .then( (attitude) => {
                        if (attitude != null) {
                            this.linkUCService.create(this.linkUCEntityfier(userToInvite, channel, false))
                            .then( (succeed) => {
                                let logged = roomHandler.userMap.get(userToInvite);
                                if (logged != undefined)
                                    logged.socket.emit('channelJoined', succeed.channelName);
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
                            this.userService.findByLogin(userToInvite)
                            .then( (attitude) => {
                                if (attitude != null) {
                                   this.linkUCService.create(this.linkUCEntityfier(userToInvite, channel, false))
                                    .then( (succeed) => {
                                        let logged = roomHandler.userMap.get(userToInvite);
                                        if (logged != undefined)
                                            logged.socket.emit('channelJoined', succeed.channelName);
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

    public leaveChannelEvent(client: Socket, roomHandler: UserRoomHandler, logger: Logger, channel: string) {
        logger.debug('leave channel request');
        let login = this.extractLogin(client);
        if (!login)
            return;
        this.linkUCService.findOne(channel, login)
        .then( (found) => {
            if (found != null) {
                this.delUserFromChannel(login, channel, roomHandler);
            }
            else
                client.emit('notice', 'you are not registered to that channel');
        })
    }

    public kickUserEvent(client: Socket, roomHandler: UserRoomHandler, logger: Logger, userToKick: string, channel: string) {
        let login = this.extractLogin(client);
        if (!login)
            return;
        this.linkUCService.findOne(channel, login)
        .then( (found) => {
            if (found == null || !found.isOp)
                client.emit('notice', "You can't do that.");
            else 
                this.linkUCService.findOne(channel, userToKick)
                .then( (kicked) => {
                    if (kicked == null)
                        client.emit('notice', "user not in channel");
                    else
                        this.delUserFromChannel(userToKick, channel, roomHandler);
                })
        })
    }

    public createChannelEvent(client: Socket, roomHandler: UserRoomHandler, logger: Logger, channel: IChannel) {
        logger.debug('create channel request');
        let login = this.extractLogin(client);
        if (!login)
            return;
        console.log(channel);
        if (channel.channelName == undefined || channel.hidden == undefined || channel.inviteOnly == undefined ||
            channel.onlyOpCanTalk == undefined || channel.persistant == undefined)
            {
                client.emit("notice", "wrong arguments");
                return;
            }
        if (channel.channelName == 'general') {
            client.emit('notice', 'This channel already exists.');
        }
        this.channelService.getOneByName(channel.channelName)
        .then( (exist) => {
            if (exist == null) {
                this.channelService.create(this.channelEntityfier(channel))
                .then( (succeed) => {
                    client.emit('channelCreated', succeed.name);
                    if (!succeed.hidden) {
                        this.channelService.listChannels().then( (list) => {
                            let strs: string[] = [];
                            for (let l of list) {
                                strs.push(l.name);}
                            roomHandler.userMap.emit('listChannel', strs)
                        })
                    }
                    this.linkUCService.create(this.linkUCEntityfier(login, succeed.name, true))
                    .then( (channLink) => {
                        this.linkUCService.findAllByUserName(login).then( (result) => {
                            logger.debug(`list of channel joined by ${login} : `);
                            console.log(result)});
                        client.emit('channelJoined', channLink.channelName)});
                })
            }
            else
                client.emit("notice", "This channel already exists.");
        })
    }
}
