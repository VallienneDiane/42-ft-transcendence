import { Logger } from "@nestjs/common";
import { Namespace, Socket } from "socket.io";

export interface IMessageChat {
    room: string;
    isChannel: boolean;
    content?: string;
}

//Format to pass at newMessageEvent emits
export interface IMessageToSend {
    //room can be a channel or an user
    sender: string;
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
    socketRoomMap: Map<string, Map<string, Socket> >;
    loginRoom: Map<string, {room: string, isChannel: boolean}>;
    logger: Logger;
    message?: IMessageChat;
    channelEntries?: IChannel;
}