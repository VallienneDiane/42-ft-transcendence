import { Navigate, Outlet, useLocation } from "react-router-dom";
import { accountService } from "../services/account.service";
import SocketContext from './context';
import React from "react";

const ProtectedRoutes = () => {
    const location = useLocation();
    const {socket, createSocket} = React.useContext(SocketContext);
    const token = accountService.getToken();
    console.log("Auth:", socket.auth.token);
    console.log('protected route', location);
    if (token !== null)
    {
        console.log("blop:" , socket);
        if (token !== socket.auth.token as string)
        {
            console.log("ne doit creer qu'une socket");
            createSocket();
        }
    }
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;