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

export const userService = {
    getAllUsers, getUser, getUserWithAvatar
}