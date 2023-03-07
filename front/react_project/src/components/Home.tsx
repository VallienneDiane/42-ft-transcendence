import React, { useContext } from "react";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";

const Home: React.FC = () => {
        let decodedToken: JwtPayload = accountService.readPayload()!;

        return (
            <div>
                <h1>Home Page</h1>
                <p>Bonjour {decodedToken?.login} !</p>
                <p>Ici on aura les boutons pour rejoindre des parties etc</p>
            </div>
        )
}

export default Home;