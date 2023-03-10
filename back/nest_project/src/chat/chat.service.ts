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
            data.roomHandler.addUser(login, data.client, "general", true);
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
            let room = data.roomHandler.delUser(login);
            if (room != undefined)
                data.roomHandler.roomMap.of(room).emit('notice', login, " just disconnect");
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
        if (!data.message.isChannel)
        {
            this.userService.findByLogin(data.message.room)
            .then (
                (found) => {
                    if (found != null) {
                        this.messageService.create(this.messageEntityfier(login, data.message));
                        data.client.emit('selfMessage', toSend);
                        let socketDest = data.chatNamespace.sockets.get(data.message.room);
                        let otherIsInGoodLocation: {room: string, isChannel: boolean} = {
                            room: login,
                            isChannel: false
                        };
                        if (socketDest != undefined) {
                            if (data.roomHandler.getRoom(data.message.room) == otherIsInGoodLocation)
                                socketDest.emit("newMessage", toSend);
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
            let found = data.roomHandler.roomMap.of("general");
            if (found != undefined)
                found.emit("newMessage", toSend);
        }
        else {
            this.linkUCService.findOne(data.message.room, login)
            .then (
                (result) => {
                    if (result != null)
                    {
                        this.messageService.create(this.messageEntityfier(login, data.message));
                        let found = data.roomHandler.roomMap.of(result.channelName);
                        if (found != undefined)
                            found.emit("newMessage", toSend);
                    }
                    else
                        data.client.emit('notRegisteredToChannel');
                }
            )
        }
    }

    public changeLocEvent(client: Socket, loc: string, isChannel: boolean, roomHandler: UserRoomHandler) {
        let login = this.extractLogin(client);
        if (isChannel)
        {
            if (loc == 'general') {
                roomHandler.joinRoom(login, loc, isChannel)
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
                                        roomHandler.joinRoom(login, found.channelName, true);
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
            this.userService.findByLogin(loc)
            .then (
                (found) => {
                    if (found != null) {
                        roomHandler.joinRoom(login, found.login, false);
                        this.messageService.findByPrivate(login, found.login)
                        .then (
                            (messages) => {
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
