import { Logger } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";
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

export interface IChannel {
    channelName: string;
    password: boolean;
    inviteOnly: boolean;
    persistant: boolean;
    onlyOpCanTalk: boolean;
    hidden: boolean;
    channelPass?: string;
}

//Trick to make typescript agree (typescript sucks a lot)
export interface IToken {
    login?: string;
    sub?: string;
    iat?: number;
    exp?: number;
}

//Interface to pass as argument at each ChatModuleHandlers
export interface IHandle {
    chatNamespace: Namespace;
    client: Socket;
    roomHandler: UserRoomHandler;
    logger: Logger;
    message?: IMessageChat;
    channelEntries?: IChannel;
}