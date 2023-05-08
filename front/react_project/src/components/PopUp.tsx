import "../styles/Base.css"
import "../styles/PopUp.scss"

import React, { useState, useEffect } from 'react'
import { SocketContext } from "./context"
import { useNavigate } from "react-router"

interface invitation {
    for: string,
    by: string,
    send: boolean
}


const PopUp: React.FC = (props) => {
    const navigate = useNavigate();
    const {socketGame} = React.useContext(SocketContext);
    const [asker, setAsker] = useState<string | null>();

    useEffect(() => {
        if (socketGame) {
            socketGame.emit("Ask_Invitation");
        }
    }, [])
    
    useEffect(() => {
        // triggered when receiving socketGame data, update position of elements
        if (socketGame) {
            socketGame.on("Invitation", (invitation: invitation) => {
                if (invitation.send === true) {
                    console.log("Invitation Received", invitation);
                    setAsker(invitation.by);
                }
                if (invitation.send === false) {
                    console.log("Invitation not send", invitation);
                }
            });

            socketGame.on("Players", () => {
                console.log('Player info received');
            })

        }
    }, [socketGame]);
    
    const acceptInvitation = () => {
        socketGame.emit("Private_Matchmaking", {target: asker});
        setAsker(null);
        navigate("/game", {state : {from : "invitation"}});
    }

    const declineInvitation = () => {

    }

    return (
        <div id="PopUp" className={asker == null ? "hide" : ""}>
            <div className="container">
                <div>{asker} invites you to play a game</div>
                <div id="accept" onClick={acceptInvitation}>Accept</div>
                <div id="decline" onClick={declineInvitation}>Decline</div>
            </div>
        </div>
    )
}

export default PopUp;