import { LogInForm, SignInForm, User} from "../models";
import { JwtPayload } from "jsonwebtoken";
import Axios from "./caller.service";
import * as jsrsasign from 'jsrsasign';

// Requete pour créer un user
let signIn = (credentials: SignInForm) => {
    return Axios.post('/user/signup', credentials);
}

// Requete pour se connecter
let login = (credentials: LogInForm) => {
    return Axios.post('/auth/login', credentials);
}

// Fonction qui est appelée pour enregistrer le JWT dans localStorage quand un user se connecte
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
    signIn, login, saveToken, logout, isLogged, getToken, readPayload
}