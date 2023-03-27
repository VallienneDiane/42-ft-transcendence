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
    errors?: string
  }

export interface UserData { 
    id?: number,
    login: string,
    email: string,
    password: string
  }

// export interface JwtPayload {
//   login: string,
//   sub: number,
//   iat: number,
//   exp: number
// }

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

// export LogInForm, SignInForm
