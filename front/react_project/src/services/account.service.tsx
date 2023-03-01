import { LogInForm, SignUpForm, User} from "../models";
import { JwtPayload } from "jsonwebtoken";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';

// Requete pour créer un user
let signUp = (credentials: SignUpForm) => {
    return Axios.post('/user/signup', credentials);
}

// Requete pour se connecter
let login = (credentials: LogInForm) => {
    return Axios.post('/auth/login', credentials);
}

////////////////////////////////////////////////////////////////////////////////
// TWO FACTOR AUTHENTIFICATOR
// quand bouton activé, doit récupérer infos du user via token et faire requete post
let enableTwoFactorAuth = () => {
    const payload = readPayload();
    return Axios.post('/auth/enable2fa', payload);
}

let verifyCodeTwoFactorAuth = (code: string) => {
    return Axios.post('/auth/verifyCode2fa', { code: code});
}

let disableTwoFactorAuth = () => {
    const payload = readPayload();
    return Axios.post('/auth/disable2fa', payload);
}

//////////////////////////////////////////////////////////////////////////////
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

// Fonction qui decrypt le JWT et retourne un objet contenant les infos crystées dans le JWT (id, login, date expiration du token etc..)
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
    enableTwoFactorAuth, verifyCodeTwoFactorAuth, disableTwoFactorAuth
}