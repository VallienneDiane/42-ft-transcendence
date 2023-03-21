import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom"
import SearchUserBar from "./SearchUserBar";
import "../styles/Profile.css"

export default function Profile() {
    const [user, setUser] = useState<string>("");
    const currentUser = useParams().login;

    useEffect(() => {
        if (currentUser !== undefined){
            setUser(currentUser)
        }
    }, [currentUser])
    
    return (
        <div id="profilePage">
            <h1>Profil de {user}</h1>
        </div>
    )
}