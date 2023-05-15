import { Outlet } from "react-router-dom"
import NavBar from "./Navbar"
import PopUp from "./PopUp";

const Layout = () => {
    return (
        <div>
            <PopUp/>
            <NavBar />
            <Outlet />
        </div>
    )
}

export default Layout;