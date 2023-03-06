import { Navigate, Outlet, useLocation } from "react-router-dom";
import { accountService } from "../services/account.service";

const ProtectedRoutes = () => {
    const location = useLocation();
    return accountService.isLogged() ? <Outlet/> : <Navigate to="/login" replace state={{ from: location }}/>;
}

export default ProtectedRoutes;