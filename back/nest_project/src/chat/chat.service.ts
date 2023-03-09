import { Injectable } from "@nestjs/common";
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
            data.chatNamespace.sockets.set(data.client.id, data.client);
            data.socketMap.set(login, data.client);
            data.client.join("general");
            data.logger.debug(`list of socket in "general" room`);
            data.chatNamespace.to("general").fetchSockets().then
            (
                (socks) => {
                    console.log(socks);
                }
            );
            data.client.emit("changeLocChannel", "general", []);
            data.logger.log(`${login} is connected, ${data.client.id}`);
            data.client.emit("test", "blop");
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
        data.logger.debug(`${login} send : `);
        console.log(data.message);
        const toSend: IMessageToSend = this.toSendFormat(login, data.message);
        this.messageService.create(this.messageEntityfier(login, data.message));
        if (!data.message.isChannel)
        {
            data.client.emit('selfMessage', toSend);
            let socketDest = data.socketMap.get(data.message.room);
            if (socketDest != undefined)
                socketDest.emit("messagePrivate", toSend);
        }
        else {
            data.chatNamespace.to(data.message.room).emit("messageChannel", toSend);
        }
    }
    
    public changeLocEvent(client: Socket, data: {Loc: string, isChannel: boolean}) {
        let login = this.extractLogin(client);
        //console.log(data, data.message);
        if (data.isChannel)
        {
            if (data.Loc == 'general')
            {
                let currentRoom: string = client.rooms.values().next().value;
                if (currentRoom != undefined)
                client.leave(currentRoom);
                client.join('general');
                client.emit('newLocChannel', 'general', []);
                return;
            }
            this.channelService.getOneByName(data.Loc)
            .then(
                (loc) => {
                    if (loc != null)
                    {
                        // console.log(loc.name, login);
                        // this.linkUCService.findAllByChannelName(loc.name)
                        // .then (
                        //     (strs) => {console.log(strs)}
                        // )
                        this.linkUCService.findOne(loc.name, login)
                        .then(
                            (found) => {
                                if (found != null)
                                {
                                    let currentRoom: string = client.rooms.values().next().value;
                                    if (currentRoom != undefined)
                                        client.leave(currentRoom);
                                    client.join(found.channelName);
                                    this.messageService.findByChannel(found.channelName)
                                    .then(
                                        ( (messages) => {
                                            client.emit('newLocChannel', found.channelName, messages);
                                        }
                                    ))
                                }
                                else
                                    client.emit('notRegisteredToChannel');
                            }
                        )
                    }
                    else
                        client.emit('noSuchChannel');
                }
            )
        }
        else
        {
            this.userService.findByLogin(data.Loc)
            .then (
                (found) => {
                    if (found != null) {
                        this.messageService.findByPrivate(login, found.login)
                        .then (
                            (messages) => {
                                let currentRoom: string = client.rooms.values().next().value;
                                if (currentRoom != undefined)
                                    client.leave(currentRoom);
                                client.emit('newLocPrivate', found.login, messages);
                            }
                        )
                    }
                    else
                        client.emit('noSuchUser');
                }
            )
        }
    }

    public listChannelEvent(client: Socket) {
        this.channelService.listChannels()
        .then (
            (list) => {
                let strs: string[] = [];
                for (let l of list)
                {
                    strs.push(l.name);
                }
                console.log(strs);
                client.emit('listChannel', strs);}
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
        data.logger.debug('create channel request');
        let login = this.extractLogin(data.client);
        this.channelService.getOneByName(data.channelEntries.channelName)
        .then( (exist) => {
            if (exist == null) {
                this.channelService.create(this.channelEntityfier(data.channelEntries))
                .then( (succeed) => {
                    data.client.emit('channelCreated', succeed.name);
                    this.channelService.listChannels().then( (list) => {
                        let strs: string[] = [];
                        for (let l of list) {
                            strs.push(l.name);}
                        data.chatNamespace.emit('listChannel', strs);
                        data.logger.debug(`list of channel : `);
                        console.log(list)});
                    this.linkUCService.create(this.linkUCEntityfier(login, succeed.name, true))
                    .then( (channLink) => {
                        this.linkUCService.findAllByUserName(login).then( (result) => {
                            data.logger.debug(`list of channel joined by ${login} : `);
                            console.log(result)});
                        data.client.emit('channelJoined', channLink.channelName)});
                })
            }
        })
    }
}
