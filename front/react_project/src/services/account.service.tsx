import { LogInForm, SignInForm, JwtPayload, User} from "../models";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';


let signIn = (credentials: SignInForm) => {
    return Axios.post('/user/signup', credentials);
}

let login = (credentials: LogInForm) => {
    return Axios.post('/auth/login', credentials);
}

let saveToken = (token: string) => {
    localStorage.setItem('token', token);
}

let logout = () => {
    Axios.post('/auth/logout');
    localStorage.removeItem('token');
}

let isLogged = () => {
    let token = localStorage.getItem('token');
    return !!token; // !! return false if token = (null)
}

let getToken = () => {
    return localStorage.getItem('token');
}

let readPayload = () => {
    console.log('token', getToken());
    return jsrsasign.KJUR.jws.JWS.parse(getToken()!).payloadObj!;
}

export const accountService = {
    signIn, login, saveToken, logout, isLogged, getToken, readPayload
}