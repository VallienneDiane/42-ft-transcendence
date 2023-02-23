import { JwtPayload } from "jsonwebtoken";
import React from "react";
import { useParams } from "react-router-dom"
import { accountService } from "../services/account.service";

export default function Profile() {
    
    // const params = useParams();
    // console.log(params);
    let user: JwtPayload = accountService.readPayload();
    return (
        <div>
            <h1>Votre profil</h1>
            <p>{user?.login} !</p>
        </div>
    )
}