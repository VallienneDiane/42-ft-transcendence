import { Navigate, Outlet, useLocation } from "react-router-dom";
import { accountService } from "../services/account.service";
import SocketContext from './context';
import React, { useEffect } from "react";

const ProtectedRoutes = () => {
    const location = useLocation();
    const {socket, createSocket, disconnect} = React.useContext(SocketContext);
    const token = accountService.getToken();
   
    useEffect(() => {
        if (token !== null)
        {
            if (token !== socket.auth.token as string)
            {
                console.log("ne doit creer qu'une socket");
                disconnect();
                createSocket();
            }
        }})

    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;