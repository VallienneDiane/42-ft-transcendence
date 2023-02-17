import { createContext } from "react";

type User = {
    id: number;
    login: string;
    email: string;
    password: string;
    logedIn: boolean
}

export const UserContext = createContext<User>({} as User);
 