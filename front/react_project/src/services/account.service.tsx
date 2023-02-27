import { LogInForm, SignUpForm, JwtPayload, User} from "../models";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';


let signUp = (credentials: SignUpForm) => {
    return Axios.post('/user/signup', credentials);
}

let login = (credentials: LogInForm) => {
    return Axios.post('/auth/login', credentials);
}

// quand bouton activé, doit récupérer infos du user via token et faire requete post
let enableTwoFactorAuth = (token: readPayload) => {
    return Axios.post('/auth/enableTwoFactorAuth', token);
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
    signUp, login, saveToken, logout, isLogged, getToken, readPayload, enableTwoFactorAuth
}