import { createContext } from "react";

type User = {
    token: string;
    id: number;
    login: string;
    email: string;
    password: string;
}

export const UserContext = createContext<User>({} as User);
 