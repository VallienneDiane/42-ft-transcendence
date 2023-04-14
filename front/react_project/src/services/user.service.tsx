import Axios from "./caller.service"

let getAllUsers = () => {
    return Axios.get("users");
}

let getUser = (id: string) => {
    return Axios.get("user/" + id);
}

export const userService = {
    getAllUsers, getUser
}