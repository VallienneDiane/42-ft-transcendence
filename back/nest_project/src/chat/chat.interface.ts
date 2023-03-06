import { Logger } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";

export interface IMessageChat {
    room: string;
    isChannel: boolean;
    content?: string;
}

//Format to pass at newMessageEvent emits
export interface IMessageToSend {
    sender?: string;
    //room can be a channel or an user
    room: string;
    content: string;
}

export interface IChannel {
    channelName: string;
    channelPass?: string;
    inviteOnly?: boolean;
    persistant?: boolean;
    onlyOpCanTalk?: boolean;
    hidden?: boolean;
}

//Trick to make typescript agree (typescript sucks a lot)
export interface IToken {
    login?: string;
    sub?: number;
    iat?: number;
    exp?: number;
}

//Interface to pass as argument at each ChatModuleHandlers
export interface IHandle {
    chatNamespace: Namespace;
    client: Socket;
    socketMap: Map<string, Socket>;
    logger: Logger;
    message?: IMessageChat;
    channelEntries?: IChannel;
}