import Axios from "./caller.service"

let getAllUsers = () => {
    return Axios.get("/users");
}

let getUser = (login: string) => {
    return Axios.get("/user/" + login);
}

export const userService = {
    getAllUsers, getUser
}