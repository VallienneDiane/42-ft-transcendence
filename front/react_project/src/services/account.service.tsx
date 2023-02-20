import LogInForm from "../models";
import SignInForm from "../models";
import Axios from "./caller.service";

let signIn = (credentials: SignInForm) => {
    return Axios.post('/user', credentials);
}

let login = (credentials: LogInForm) => {
    return Axios.post('/user/login', credentials);
}

let saveToken = (token: string) => {
    localStorage.setItem('token', token);
}

let logout = () => {
    localStorage.removeItem('token');
}

let isLogged = () => {
    // NEED TO CHECK IF TOKEN IS VALID !!
    let token = localStorage.getItem('token');
    return !!token; // !! return false if token = (null)
}

let getToken = () => {
    return localStorage.getItem('token');
}

export const accountService = {
    signIn, login, saveToken, logout, isLogged, getToken
}