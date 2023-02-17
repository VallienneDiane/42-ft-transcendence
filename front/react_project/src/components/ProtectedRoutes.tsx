import { useContext } from "react"
import { Navigate, Outlet } from "react-router-dom";
import { UserContext } from "../user/UserContext"
import SignupForm from "./SignupForm";

const ProtectedRoutes = () => {
    const user = useContext(UserContext);
    console.log(user);
    
    return user.logedIn ? <Outlet/> : <Navigate to="/signin"/>;
}

export default ProtectedRoutes;