import React from "react";
import { useParams } from "react-router-dom"
import NavBar from "./Navbar";

export default function Profile() {
    
    const params = useParams();
    console.log(params);
    
    return (
        <div>
            <NavBar/>
            <h1>Votre profil</h1>
        </div>
    )
}