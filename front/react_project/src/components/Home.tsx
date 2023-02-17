import React, { useContext } from "react";
import { UserContext } from "../user/UserContext";
import NavBar from "./Navbar";

// export default function Home() {
//     let user = useContext(UserContext);

//     // user.login = "Connard";
//     return (
//         <div>
//             <NavBar/>
//             <h1>Home Page</h1>
//             <p>Bonjour {user?.login} ayant comme mail {user?.email} et comme password {user?.password}</p>
//             <p>Ici on aura les boutons pour rejoindre des parties etc</p>
//         </div>
//     )
// }

const Home: React.FC = () => {
        let user = useContext(UserContext);


        return (
            <div>
                <NavBar/>
                <h1>Home Page</h1>
                <p>Bonjour {user?.login} ayant comme mail {user?.email} et comme password {user?.password}</p>
                <p>Ici on aura les boutons pour rejoindre des parties etc</p>
            </div>
        )
}

export default Home;