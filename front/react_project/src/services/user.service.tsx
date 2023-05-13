import Axios from "./caller.service"

let getAllUsers = () => {
    return Axios.get("users");
}

let getUser = (id: string) => {
    return Axios.get("user/" + id);
}

let getUserWithAvatar = (id: string) => {
    return Axios.get("userWithAvatar/" + id);
}

let getUserWithAvatarUsingLogin = (login: string) => {
    console.log(login);
    return Axios.get("userWithAvatarUsingLogin/" + login);
}

export const userService = {
    getAllUsers, getUser, getUserWithAvatar, getUserWithAvatarUsingLogin
}