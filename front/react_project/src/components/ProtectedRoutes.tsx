import { Navigate, Outlet, useLocation } from "react-router-dom";
import { accountService } from "../services/account.service";
import { SocketContext } from './context';
import React, { useEffect } from "react";

const ProtectedRoutes = () => {
    const location = useLocation();
    const {socket, createSocket} = React.useContext(SocketContext);
    const token = accountService.getToken();
   
    useEffect(() => {
        if (token !== null && socket === null) {
            createSocket();
        }
    })
        
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login" replace state={{ from: location }}/>;
}

export default ProtectedRoutes;