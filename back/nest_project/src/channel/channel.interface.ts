import { StringLiteral } from "@babel/types";
import { IMessage } from "./message.interface";

export interface IChannel {
	name: string,
	password?: string
	history: IMessage[],
	userList: string[],
}