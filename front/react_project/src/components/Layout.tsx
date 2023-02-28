import { Outlet } from "react-router-dom"
import NavBar from "./Navbar"

const Layout = () => {
    console.log('lAYOUT');
    return (
        <div>
            <NavBar />
            <Outlet />
        </div>
    )
}

export default Layout;