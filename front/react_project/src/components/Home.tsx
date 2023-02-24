import React, { useContext } from "react";
import { UserContext } from "../user/UserContext";
import {User} from "../models";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";


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
        let user: JwtPayload = accountService.readPayload();

        return (
            <div>
                <h1>Home Page</h1>
                <p>Bonjour {user?.login} !</p>
                <p>Ici on aura les boutons pour rejoindre des parties etc</p>
            </div>
        )
}

export default Home;