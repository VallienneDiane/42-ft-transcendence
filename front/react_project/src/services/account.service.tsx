import { LogInForm, SignUpForm, VerifyCodeForm, User} from "../models";
import { JwtPayload } from "jsonwebtoken";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';

// Request to signup
let signUp = (credentials: SignUpForm) => {
    return Axios.post('/user/signup', credentials);
}
// Request to login
let login = (credentials: LogInForm) => {
    return Axios.post('auth/login', credentials);
}
// Request to generate token
let generateToken = (login: string) => {
    return Axios.post('auth/generateToken', {login});
}
////////////////// TWO FACTOR AUTHENTIFICATOR /////////////////////////////
//check if 2fa / google auth is active when login
let is2faActive = (login: string) => {
    return Axios.post('auth/is2faActive', {login});
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
///////////////////////////////////////////////////////////////////////////
////////////////////          LOGIN WITH 42 API       ////////////////////
// let authorize42 = () => {
//     const auth = Axios.get('auth/authorize42');
//     console.log("REQUEST GET RESPONSE auth42", auth);
//     return auth;
// }



///////////////////////////////////////////////////////////////////////////

let saveToken = (token: string) => {
    localStorage.setItem('token', token);
}

// Lorsqu'un user se logOut, une requete est envoyée au back pour l'en informer et le token est enlevé de localStorage
let logout = () => {
    Axios.post('/auth/logout');
    localStorage.removeItem('token');
}

// Fonction qui check si user est connecté. Et que le token n'est pas expiré
let isLogged = () => {
    let token = localStorage.getItem('token');
    if (token !== null) {
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

let getToken = () => {
    return localStorage.getItem('token');
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

export const accountService = {
    signUp, login, saveToken, logout, isLogged, getToken, readPayload, 
    enable2fa, verifyCode2fa, verifyCode2faSettings, disable2fa, 
    is2faActive, generateToken, is2faActiveSettings
}