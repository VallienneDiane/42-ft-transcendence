import Axios from "./caller.service"

let getAllUsers = () => {
    return Axios.get("/users");
}

let getUser = (login: string) => {
    return Axios.get("/user/" + login);
}

let getAvatar = (id: string) => {
    return Axios.get("getAvatar" + id);
}

export const userService = {
    getAllUsers, getUser, getAvatar
}