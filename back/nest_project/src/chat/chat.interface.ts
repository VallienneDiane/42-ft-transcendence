
export interface IMessageChat {
    room: string;
    isChannel: boolean;
    content?: string;
}

//Format to pass at newMessageEvent emits
export interface IMessageToSend {
    //room can be a channel or an user
    date: Date;
    senderName: string;
    senderId: string;
    content: string;
}

export interface IChannelToEmit {
    id: string;
    date: Date;
    name: string;
    password: boolean;
    inviteOnly: boolean;
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

export interface IRequest {
    id: string;
    senderId: string;
    receiverId: string;
    state: string;
}
