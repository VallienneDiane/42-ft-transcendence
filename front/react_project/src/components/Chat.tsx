import React, { useEffect, useRef, useState } from "react";
import { userService } from "../services/user.service";
import UserData from "../models"


const Chat: React.FC = () => {
    // variable synchronisée entre le code et le template (html injecté)
    // crée une variable synchronisable (users), ici initialisée à [] (tableau vide)
    const [users, setUsers] = useState<UserData[]>([])
    // const flag = useRef(false)

    // useEffect s'execute dès que le composant est chargé, ou modifié, ou supprimé
    useEffect(() => {
        userService.getAllUsers()
        .then(Response => {
            // met à jour la variable 'users' grâce a son setter à qui on envoie 'Response.data.data'
            setUsers(Response.data);
        })
        .catch(error => console.log(error))

        // empeche le useEffect de se lancer 2 fois ?!
        // return () => flag.current = true;

    }, []) // ici le deuxième paramètre de useEffect est [], il s'agit des dépendances sur lesquelles chaque changement va activer le useEffect

    return ( 
        <div>
            <h1>Chat Page</h1>
            <h2>Users in database :</h2>
            <ul>
                {
                    users.map(user => {
                        return (
                            <li>
                                <p>
                                {user.id}&thinsp;
                                {user.login}&thinsp;
                                {user.email}
                                </p>
                            </li>
                        )
                    })
                }
            </ul>
        </div>
    )
}

export default Chat;