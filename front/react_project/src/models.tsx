import { Socket } from 'socket.io-client'
import { JwtPayload } from "jsonwebtoken";

export interface LogInForm {
    login: string,
    password: string
}

export interface VerifyCodeForm {
    login?: string,
    code: string,
    errors?:string,
}

export interface SignUpForm { 
    id?: number,
    login: string,
    email: string,
    password: string,
    errors?: string,
    avatarSvg?: string
}
  
export interface UserData { 
    id?: number,
    login: string,
    email: string,
    password: string
}

export interface IUserToEmit {
  id: string;
  login: string;
}

export interface IChannelToEmit {
  id: string;
  date: Date;
  name: string;
  password: boolean;
  inviteOnly: boolean;
  persistant: boolean;
  onlyOpCanTalk: boolean;
  hidden: boolean;
  normalUsers: IUserToEmit[];
  opUsers: IUserToEmit[];
  godUser?: IUserToEmit;
}

  // export interface JwtPayload {
//   login: string,
//   sub: number,
//   iat: number,
//   exp: number
// }

export interface User {
  // token: string,
  id?: number,
  login: string,
  email: string,
  avatarSvg?: string
}

export interface IChannel {
  name: string;
  password: boolean;
  channelPass?: string;
  inviteOnly: boolean;
  persistant: boolean;
  onlyOpCanTalk: boolean;
  hidden: boolean;
}

export interface IMessageEntity {
  id?: number,
  room?: string,
  isChannel?: boolean,
  sender: string,
  content: string,
  date: Date,
}

export interface Message {
  id: string,
  text: string;
  sender?: string;
}

export interface IMessageToSend {
  date: Date;
  sender: string;
  room: string;
  content: string;
}

export interface IDest {
  Loc: string;
  isChannel: boolean;
  channel?: IChannel;
  isOp?: boolean;
};
