import "../styles/Base.css"
import "../styles/PopUp.scss"

import React, { useState, useEffect } from 'react'
import { SocketContext } from "./context"
import { useNavigate } from "react-router"
import { accountService } from "../services/account.service"
import { userService } from "../services/user.service"
import { User } from "../models"
import { JwtPayload } from "jsonwebtoken"

interface invitation {
    for: string,
    by: string,
    send: boolean
}

interface invite {
    for: string,
    by: string,
    status: string,
}


const PopUp: React.FC = () => {
    const navigate = useNavigate();
    let user: User;
    const {socketGame} = React.useContext(SocketContext);
    const [invite, setInvite] = useState<invite | null>();
    const [popUpContent, setPopUpContent] = useState<JSX.Element>();

    if (accountService.isLogged()) {
        let decodedToken: JwtPayload = accountService.readPayload()!;
        const id = decodedToken.sub;
        userService.getUserWithAvatar(id!)
        .then(response => {
            console.log(response.data);
            user = response.data;
            console.log("apres requete", user);
        })
        .catch(error => {
            console.log(error);
        });
    }
    
    useEffect(() => {
        
        if (socketGame) {
            socketGame.emit("Ask_Invitation");
        }
    }, [])
    
    useEffect(() => {
        console.log("dans socket", user);
        if (socketGame) {
            socketGame.on("Invitation", (invitation: invitation) => {
                console.log("Invitation SOcket", invitation, user);
                
                if (invitation.for === user?.login) {
                    setInvite({for: invitation.for, by: invitation.by, status: "received"});
                    console.log("Invitation Received", invitation);
                }
                if (invitation.send === true && invitation.by === user?.login) {
                    setInvite({for: invitation.for, by: invitation.by, status: "sen"});
                    console.log("Invitation successfuly sent" , invitation);
                }
                if (invitation.send === false && invitation.by === user?.login) {
                    setInvite({for: invitation.for, by: invitation.by, status: "notSend"});
                    console.log("Invitation not send", invitation);
                }
            });

            socketGame.on("Players", () => {
                console.log('Player info received');
            })
        }
    }, [socketGame]);

    useEffect(() => {
        if (invite) {
            if (invite?.status === "received") {
                setPopUpContent(
                    <div className="container">
                        <div>{invite?.by} invites you to play a game</div>
                        <div id="accept" onClick={acceptInvitation}>Accept</div>
                        <div id="decline" onClick={declineInvitation}>Decline</div>
                    </div>
                )
            }
        }
    }, [invite])
    
    const acceptInvitation = () => {
        socketGame.emit("Private_Matchmaking", {target: invite?.by});
        setInvite(null);
        navigate("/game", {state : {from : "invitation"}});
    }

    const declineInvitation = () => {

    }

    return (
        <div id="PopUp" className={invite == null ? "hide" : ""}>
            {popUpContent}
        </div>
    )
}

export default PopUp;