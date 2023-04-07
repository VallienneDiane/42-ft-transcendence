import { Logger } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";
import { UserEntity } from "src/user/user.entity";
import { ChannelEntity } from "./channel/channel.entity";
import { UserRoomHandler } from "./chat.classes";

export interface IMessageChat {
    room: string;
    isChannel: boolean;
    content?: string;
}

//Format to pass at newMessageEvent emits
export interface IMessageToSend {
    //room can be a channel or an user
    date: Date;
    sender: string;
    room: string;
    content: string;
}

export interface IChannelToEmit {
    id: string;
    date: Date;
    name: string;
    password: boolean;
    inviteOnly: boolean;
    hidden: boolean;
    normalUsers: IUserToEmit[];
    opUsers: IUserToEmit[];
    godUser?: IUserToEmit;
}

export interface IUserToEmit {
    id: string;
    login: string;
}

//Trick to make typescript agree (typescript sucks a lot)
export interface IToken {
    login?: string;
    sub?: string;
    iat?: number;
    exp?: number;
}