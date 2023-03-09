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

    private channInUCList(channEnt: ChannelEntity, UCList: LinkUCEntity[]): boolean {
        for (let l of UCList) {
            if (l.channelName == channEnt.name)
                return true;
        }
        return false;
    }

    private emitInRoom(socketRoom: Map<string, Socket>, ev: string, ...args: any[]) {
        socketRoom.forEach(
            (sock) => {
                sock.emit(ev, args);
            }
        )
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
            data.chatNamespace.sockets.set(login, data.client);
            data.socketRoomMap.get("general").set(login, data.client);
            data.loginRoom.set(login, {room: "general", isChannel: true});
            console.log(login);
            data.client.emit("changeLocChannel", "general", []);
            data.logger.log(`${login} is connected, ${data.client.id}`);
            data.client.emit("test", "blop");
        }
    }

    public disconnectEvent(data: IHandle) {
        if (data.client.handshake.auth['token'] != null) {
            let login = this.extractLogin(data.client);
            if (!login)
                return;
            data.chatNamespace.sockets.delete(login);
            let loc = data.loginRoom.get(login);
            if (loc != undefined && loc.isChannel) {
                data.socketRoomMap.get(loc.room).delete(login);
                this.emitInRoom(data.socketRoomMap.get(loc.room), "fromServerMessage", login, ' just disconnect');
            }
            data.loginRoom.delete(login);
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
            this.userService.findByLogin(data.message.room)
            .then (
                (found) => {
                    if (found != null) {
                        data.client.emit('selfMessage', toSend);
                        let socketDest = data.chatNamespace.sockets.get(data.message.room);
                        let otherIsInGoodLocation: {room: string, isChannel: boolean} = {
                            room: login,
                            isChannel: false
                        };
                        if (socketDest != undefined) {
                            if (data.loginRoom.get(data.message.room) == otherIsInGoodLocation)
                                socketDest.emit("messagePrivate", toSend);
                            else
                                socketDest.emit("pingedBy", login);
                        }
                    }
                    else
                        data.client.emit('userNotFound');
                }
            )
        }
        else if (data.message.room == "general") {
            this.emitInRoom(data.socketRoomMap.get(data.message.room), "messageChannel", toSend);
        }
        else {
            this.linkUCService.findOne(data.message.room, login)
            .then (
                (result) => {
                    if (result != null)
                    {
                        this.emitInRoom(data.socketRoomMap.get(data.message.room), "messageChannel", toSend);
                    }
                    else
                        data.client.emit('notRegisteredToChannel');
                }
            )
        }
    }

    public changeLocEvent(client: Socket, data: {Loc: string, isChannel: boolean, loginRoom: Map<string, {room: string, isChannel: boolean}>, socketRoomMap: Map<string, Map<string, Socket> >} ) {
        let login = this.extractLogin(client);
        if (data.isChannel)
        {
            if (data.Loc == 'general') {
                let currentRoom = data.loginRoom.get(login);
                if (currentRoom != undefined && currentRoom.isChannel)
                    data.socketRoomMap.get(currentRoom.room).delete(login);
                data.socketRoomMap.get("general").set(login, client);
                data.loginRoom.set(login, {room: "general", isChannel: true});
                client.emit('newLocChannel', 'general', []);
                return;
            }
            else {
                this.channelService.getOneByName(data.Loc)
                .then(
                    (loc) => {
                        if (loc != null)
                        {
                            this.linkUCService.findOne(loc.name, login)
                            .then(
                                (found) => {
                                    if (found != null)
                                    {
                                        let currentRoom = data.loginRoom.get(login);
                                        if (currentRoom != undefined && currentRoom.isChannel)
                                            data.socketRoomMap.get(currentRoom.room).delete(login);
                                        if (data.socketRoomMap.get(found.channelName) == undefined)
                                            data.socketRoomMap.set(found.channelName, new Map<string, Socket>())
                                        data.socketRoomMap.get(found.channelName).set(login, client);
                                        data.loginRoom.set(login, {room: found.channelName, isChannel: true});
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
                                let currentRoom = data.loginRoom.get(login);
                                if (currentRoom != undefined && currentRoom.isChannel)
                                    data.socketRoomMap.get(currentRoom.room).delete(login);
                                data.loginRoom.delete(login);
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
        let login = this.extractLogin(client);
        this.linkUCService.findAllByUserName(login)
        .then(
            (notToDisplay) => {
                this.channelService.listChannels()
                .then (
                    (list) => {
                        let strs: string[] = [];
                        for (let l of list)
                        {
                            if (!this.channInUCList(l, notToDisplay))
                                strs.push(l.name);
                        }
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
                client.emit('listMyChannel', strs);
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
