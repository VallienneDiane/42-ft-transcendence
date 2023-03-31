import { ReactNode } from "react";
import { Outlet } from "react-router-dom"
import NavBar from "./Navbar"

// type LayoutProps = {
//     children: ReactNode;
// };
  
// const Layout = ({ children }: LayoutProps) => {
//     return (
//         <div>
//         <NavBar />
//         {children}
//         </div>
//     );
// };

const Layout = () => {
    return (
        <div>
            <NavBar />
            <Outlet />
        </div>
    )
}

export default Layout;