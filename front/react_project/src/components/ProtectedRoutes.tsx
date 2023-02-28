import { Navigate, Outlet, useLocation } from "react-router-dom";
import { accountService } from "../services/account.service";

const ProtectedRoutes = () => {
    const location = useLocation();
    console.log('protected route', location);
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login"/>;
}

export default ProtectedRoutes;