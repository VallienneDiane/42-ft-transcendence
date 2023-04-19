import { AvatarSettingsForm, LogInForm, LoginSettingsForm, SettingsForm, SignUpForm, VerifyCodeForm } from "../models";
import { JwtPayload } from "jsonwebtoken";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';

/**
 * Request to signup
 * @param credentials 
 * @returns 
 */
let signUp = (credentials: SignUpForm) => {
    return Axios.post('/user/signup', credentials);
}
/**
 * Request to login
 * @param credentials 
 * @returns 
 */
let login = (credentials: LogInForm) => {
    return Axios.post('auth/login', credentials);
}
/**
 * Upload Avatar picture
 * @param file 
 * @returns 
 */
// let uploadAvatar = (file: string) => {
//     const user: JwtPayload = accountService.readPayload()!;
//     return Axios.post('user/uploadAvatar', {id: user.sub, file});
// }
 /**
  * Get Avatar picture
  * @param id 
  * @returns 
  */
let getAvatar = (id: string) => {
    return Axios.get('getAvatar/' + id);
}
/**
 * Check if login is unique
 * @param login 
 * @returns 
 */
let isUniqueLogin = (login: string) => {
    return Axios.get('user/isUniqueLogin/' + login);
}
/**
 * Check if it's a 42 id
 * @param id42 
 * @returns 
 */
let isId42 = (id42: string) => {
    return Axios.get('user/isId42/' + id42);
}
/**
 * Update name and avatar if first connection with 42
 * @param credentials 
 * @returns 
 */
let createUser = (credentials: SettingsForm ) => {
    return Axios.post('user/signup42', credentials);
}
/**
 * Update login
 * @param credentials 
 * @returns 
 */
let updateLogin = (credentials: LoginSettingsForm ) => {
    return Axios.post('user/updateLogin', credentials);//return 
}
/**
 * Update avatar
 * @param credentials 
 * @returns 
 */
let updateAvatar = (credentials: AvatarSettingsForm ) => {
    return Axios.post('user/updateAvatar', credentials);//return 
}
/**
 * Check if user connected and that token is valid
 * @returns 
 */
let isLogged = () => {
    let token = localStorage.getItem('token');
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
/**
 * Request to generate token
 * @param id 
 * @returns 
 */
let generateToken = (id: string) => {
    return Axios.post('auth/generateToken', {id});
}
let generateToken42 = (id42: string) => {
    return Axios.post('auth/generateToken42', {id42});
}
/**
 * Save token in storage
 * @param token 
 */
let saveToken = (token: string) => {
    localStorage.setItem('token', token);
}
/**
 * Get token from local storage
 * @returns 
 */
let getToken = () => {
    return localStorage.getItem('token');
}
/**
 * When user logout, request send to inform server and destroy token
 */
let logout = () => {
    Axios.post('/auth/logout');
    localStorage.removeItem('token');
}
/**
 * decrypt token and returns infos of token (id, expiration time)
 * @returns 
 */
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
/**
 * Check if 2fa / google auth is active when login
 * @param id 
 * @returns 
 */
let is2faActive = (id: string) => {
    return Axios.post('auth/is2faActive', {id});
}
let is2faActive42 = (id42: string) => {
    return Axios.post('auth/is2faActive42', {id42});
}
/**
 * check if 2fa is active in settings to display the right setting and check token
 * @param id 
 * @returns 
 */
let is2faActiveSettings = (id: string) => {
    return Axios.post('auth/is2faActiveSettings', {id});
}
/**
 * Enable 2fa
 * @returns 
 */
let enable2fa = () => {
    return Axios.post('auth/enable2fa');
}
/**
 * Verify code submitted by the user
 * @param credentials 
 * @returns 
 */
let verifyCode2fa = (credentials: VerifyCodeForm) => {
    return Axios.post('auth/verifyCode', credentials);
}
/**
 * Verify code submitted by the user in settings to check token
 * @param credentials 
 * @returns 
 */
let verifyCode2faSettings = (credentials: VerifyCodeForm) => {
    return Axios.post('auth/verifyCodeSettings', credentials);
}
/**
 * Disable 2fa
 * @returns 
 */
let disable2fa = () => {
    return Axios.post('auth/disable2fa');
}
/**
 * SIGN IN WITH 42
 * get url to give authorization to connect api42
 * @returns 
 */
let url42 = () => {
    return Axios.get('/')
}
/**
 * Send code to get token and infos user from the api and then generate jwt token
 * @param code 
 * @returns 
 */
let callback = (code: string) => {
    return Axios.get('/callback?code=' + code);
}

export const accountService = {
    signUp, login, isUniqueLogin, isId42, createUser, saveToken, logout, isLogged, 
    getToken, readPayload, enable2fa, verifyCode2fa, verifyCode2faSettings, disable2fa, 
    is2faActive,is2faActive42, generateToken, generateToken42, is2faActiveSettings, 
    getAvatar, url42, callback, updateLogin, updateAvatar //uploadAvatar,
}