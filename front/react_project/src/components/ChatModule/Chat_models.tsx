import { Socket } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export interface SocketContextType {
	socket: Socket<DefaultEventsMap, DefaultEventsMap>;
	createSocket: () => void;
	disconnect: () => void;
}

export interface IUser {
	id: string;
	login: string;
}

// ChannelDMList, Popup, SearchChat, ModifyChannel
export interface IChannel {
	id?: string;
	date?: Date;
	name: string;
	password: boolean;
	channelPass?: string;
	inviteOnly: boolean;
	hidden: boolean;
	normalUsers?: IUser[];
	opUsers?: IUser[];
	godUser?: IUser;
}

// ChatModule, SidebarChannel, SidebarUser, Header, SendMessageForm
export interface IDest {
	id: string;
	name: string;
	isChannel: boolean;
	channel?: IChannel;
	status?: string;
};

// ChatModule, SearchChat, MessageList, MessageDisplay
export interface IMessage {
	id: string; // corespond à la date
	content: string;
	senderName: string;
	senderId: string;
}

export interface IMessageReceived {
	date: Date;
	content: string;
	senderName: string;
	senderId: string;
}

// SearchChat, SearchElement
export interface ISearch {
	id: string;
	name: string;
	isChannel: boolean;
	password: boolean;
	isClickable: boolean;
}
