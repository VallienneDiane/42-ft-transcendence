import React, { FC, ReactNode} from "react";
import { UserContext } from "./UserContext";

type UserProviderProps = {
    user: {
        id: number;
        login: string;
        email: string;
        password: string;
        logedIn: boolean;
    };
    children: ReactNode;
}

const UserProvider: FC<UserProviderProps> = ({user, children}) => {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    );
}

export default UserProvider;