import { Injectable } from "@nestjs/common";
import { Namespace, Server, Socket } from "socket.io";
import { IChannel, IHandle, IMessageChat, IMessageToSend, IToken } from "./chat.interface";
import * as jsrsasign from 'jsrsasign';
import { MessageEntity } from "./message/message.entity";
import { LinkUCEntity } from "./link_users_channels/linkUC.entity";
import { ChannelEntity } from "./channel/channel.entity";
import { UserEntity } from "src/user/user.entity";
import { MessageService } from "./message/message.service";
import { ChannelService } from "./channel/channel.service";
import { LinkUCService } from "./link_users_channels/linkUC.service";
import { UserService } from "../user/user.service";

@Injectable({})
export class ChatService {
    constructor (
        private messageService: MessageService,
        private channelService: ChannelService,
        private linkUCService: LinkUCService,
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

    private toSendFormat(login: string, data: IMessageChat): IMessageToSend {
        return {
            sender: login,
            room: data.room,
            content: data.content
        };
    }

    public connectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            let login = this.extractLogin(data.client);
            if (!login)
                return;
            data.chatNamespace.sockets.set(data.client.id, data.client);
            data.socketMap.set(login, data.client);
            data.client.join("general");
            data.client.emit("getRoom", "general", []);
            data.logger.log(`${login} is connected`);
        }
    }

    public disconnectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            let login = this.extractLogin(data.client);
            data.chatNamespace.sockets.delete(data.client.id);
            if (!login)
                return;
            let room: string = data.client.rooms.values().next().value;
            data.socketMap.delete(login);
            data.chatNamespace.to(room).emit("fromServerMessage", login, ' just disconnect');
            data.logger.log(`${login} is disconnected`);
        }
    }

    public newMessageEvent(data: IHandle) {
        let login = this.extractLogin(data.client);
        if (!login)
            return;
        const toSend: IMessageToSend = this.toSendFormat(login, data.message);
        this.messageService.create(this.messageEntityfier(login, data.message));
        data.client.emit('selfMessage', toSend);
        if (!data.message.isChannel)
        {
            let socketDest = data.socketMap.get(data.message.room);
            if (socketDest != undefined)
                socketDest.emit("messagePrivate", toSend);
        }
        else {
            data.chatNamespace.to(data.message.room).emit("messageChannel", toSend);
        }
    }

    public changeLocEvent(data: IHandle) {
        let login = this.extractLogin(data.client);
        if (data.message.isChannel)
        {
            this.channelService.getOneByName(data.message.room)
            .then(
                (loc) => {
                    if (loc != null)
                    {
                        this.linkUCService.findOne(loc.name, login)
                        .then(
                            (found) => {
                                if (found != null)
                                {
                                    let currentRoom: string = data.client.rooms.values().next().value;
                                    if (currentRoom != undefined)
                                        data.client.leave(currentRoom);
                                    data.client.join(found.channelName);
                                    this.messageService.findByChannel(found.channelName)
                                    .then(
                                        ( (messages) => {
                                            data.client.emit('newLocChannel', found.channelName, messages);
                                        }
                                    ))
                                }
                                else
                                    data.client.emit('notRegisteredToChannel');
                            }
                        )
                    }
                    else
                        data.client.emit('noSuchChannel');
                }
            )
        }
        else
        {
            this.userService.findByLogin(data.message.room)
            .then (
                (found) => {
                    if (found != null) {
                        this.messageService.findByPrivate(login, found.login)
                        .then (
                            (messages) => {
                                let currentRoom: string = data.client.rooms.values().next().value;
                                if (currentRoom != undefined)
                                    data.client.leave(currentRoom);
                                data.client.emit('newLocPrivate', found.login, messages);
                            }
                        )
                    }
                    else
                        data.client.emit('noSuchUser');
                }
            )
        }
    }

    public listChannelEvent(client: Socket) {
        this.channelService.listChannels()
        .then (
            (list) => {client.emit('channelList', list);}
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
                        if (chan.pass != undefined && data.channelEntries.channelPass! == chan.pass) {
                            this.linkUCService.create(this.linkUCEntityfier(login, data.channelEntries.channelName, false))
                            .then( (succeed) => data.client.emit('channelJoined', succeed.channelName));
                        }
                        else
                            data.client.emit('wrongChannelPassword');
                    }
                    else
                        data.client.emit('noSuchChannel');
                })
            }
        } )
    }

    public createChannelEvent(data: IHandle) {
        let login = this.extractLogin(data.client);
        this.channelService.getOneByName(data.channelEntries.channelName)
        .then( (exist) => {
            if (exist != null) {
                this.channelService.create(this.channelEntityfier(data.channelEntries))
                .then( (succeed) => {
                    data.client.emit('channelCreated', succeed.name);
                    this.linkUCService.create(this.linkUCEntityfier(login, succeed.name, true))
                    .then( (channLink) => data.client.emit('channelJoined', channLink.channelName));
                })
            }
        })
    }
}