import { Navigate, Outlet } from "react-router-dom";
import { accountService } from "../services/account.service";

const ProtectedRoutes = () => {
    console.log(accountService.isLogged())
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;