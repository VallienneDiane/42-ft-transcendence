import "../styles/Home.css"
import React, { useContext } from "react";
import { UserContext } from "../user/UserContext";
import {User} from "../models";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import SearchUserBar from "./SearchUserBar";


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
        let decodedToken: JwtPayload = accountService.readPayload()!;

        return (
            <div id="Home">
                <h1>Home Page</h1>
                <p>Bonjour {decodedToken?.login} !</p>
                <SearchUserBar/>
                <p>Ici on aura les boutons pour rejoindre des parties etc</p>
            </div>
        )
}

export default Home;