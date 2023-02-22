import axios from "axios";
import { accountService } from "./account.service";

const Axios = axios.create({
    baseURL: 'http://localhost:3000'
})

// Intercepteur pour le token
// Intercepte la requete lrosqu'elle sort du front, la modifie et la relache vers le back

Axios.interceptors.request.use(request => {
    if (accountService.isLogged()) (
        request.headers.Authorization = 'Bearer ' + accountService.getToken()
    )


    return request;
})

export default Axios