import { Navigate, Outlet } from "react-router-dom";
import { accountService } from "../services/account.service";

const ProtectedRoutes = () => {
    console.log('protected route');
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;