import { LogInForm, SettingsForm, SignUpForm, VerifyCodeForm } from "../models";
import { JwtPayload } from "jsonwebtoken";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';

////////////////// SIGN UP - LOGIN - LOGOUT - TOKEN /////////////////
// Request to signup
let signUp = (credentials: SignUpForm) => {
    return Axios.post('/user/signup', credentials);
}
// Request to login
let login = (credentials: LogInForm) => {
    return Axios.post('auth/login', credentials);
}
// Upload Avatar picture
let uploadAvatar = (file: string) => {
    const user: JwtPayload = accountService.readPayload()!;
    return Axios.post('user/uploadAvatar', {id: user.sub, file});
}
// Get Avatar picture
let getAvatar = (id: string) => {
    return Axios.get('getAvatar/' + id);
}

let getAllLogins = () => {
    return Axios.post('user/getAllLogins');
}
let getAllIds42 = () => {
    return Axios.post('user/getAllIds');
}
// Update name and avatar if first connection with 42
let createUser = (credentials: SettingsForm ) => {
    return Axios.post('user/create', credentials);
}

// Fonction qui check si user est connecté. Et que le token n'est pas expiré
let isLogged = () => {
    let token = sessionStorage.getItem('token');
    if (token !== null)  { 
        let decodedToken: JwtPayload = accountService.readPayload()!;
        if (decodedToken === null || decodedToken === undefined || ( decodedToken.exp !== undefined && decodedToken.exp < Date.now() / 1000)) {
            logout();
            return (false);
        }
        else {
            return (true);
        }
    }
    else {
        return (false);
    }
}
// Request to generate token
let generateToken = (login: string) => {
    return Axios.post('auth/generateToken', {login});
}

let generateToken42 = (id42: number) => {
    return Axios.post('auth/generateToken42', {id42});
}

let saveToken = (token: string) => {
    sessionStorage.setItem('token', token);
}
//get token from local storage
let getToken = () => {
    return sessionStorage.getItem('token');
}
// Lorsqu'un user se logOut, une requete est envoyée au back pour l'en informer et le token est enlevé de localStorage
let logout = () => {
    Axios.post('/auth/logout');
    sessionStorage.removeItem('token');
}
// Fonction qui decrypt le JWT et retourne un objet contenant les infos cryptées dans le JWT (id, login, date expiration du token etc..)
let readPayload = () => {
    let token = getToken();
    if (token === null) {
        return (null);
    }
    else {
        try {
            let parseToken = jsrsasign.KJUR.jws.JWS.parse(token);
            return (parseToken.payloadObj);
        }
        catch (error) {
            console.log('Error parsing JWT: ', error)
            return (null);
        }
    }
}
////////////////// TWO FACTOR AUTHENTIFICATOR ////////////////////
//check if 2fa / google auth is active when login
let is2faActive = (login: string) => {
    return Axios.post('auth/is2faActive', {login});
}
let is2faActive42 = (id42: number) => {
    return Axios.post('auth/is2faActive42', {id42});
}
//check if 2fa is active in settings to display the right setting and check token
let is2faActiveSettings = (login: string) => {
    return Axios.post('auth/is2faActiveSettings', {login});
}
//enable 2fa
let enable2fa = () => {
    return Axios.post('auth/enable2fa');
}
//verify code submitted by the user
let verifyCode2fa = (credentials: VerifyCodeForm) => {
    return Axios.post('auth/verifyCode', credentials);
}
//verify code submitted by the user in settings to check token
let verifyCode2faSettings = (credentials: VerifyCodeForm) => {
    return Axios.post('auth/verifyCodeSettings', credentials);
}
//disable 2fa
let disable2fa = () => {
    return Axios.post('auth/disable2fa');
}
////////////////// SIGN IN WITH 42 /////////////////////////////
//get url to give authorization to connect api42
let url42 = () => {
    return Axios.get('/')
}
//send code to get token and infos user from the api and then generate jwt token
let callback = (code: string) => {
    return Axios.get('/callback?code=' + code);
}

export const accountService = {
    signUp, login, getAllLogins, getAllIds42, createUser, saveToken, logout, isLogged, 
    getToken, readPayload, enable2fa, verifyCode2fa, verifyCode2faSettings, disable2fa, 
    is2faActive,is2faActive42, generateToken, generateToken42, is2faActiveSettings, uploadAvatar,
    getAvatar, url42, callback
}