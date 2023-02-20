import { Navigate, Outlet } from "react-router-dom";
import { accountService } from "../services/account.service";

const ProtectedRoutes = () => {
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;