import "../styles/Base.css"
import "../styles/PopUp.scss"

import React, { useState, useEffect } from 'react'
import { SocketContext } from "./context"

interface invitation {
    for: string,
    by: string,
    send: boolean
}


const PopUp: React.FC = (props) => {
    const {socketGame} = React.useContext(SocketContext);
    const [asker, setAsker] = useState<string>();

    useEffect(() => {
        // triggered when receiving socketGame data, update position of elements
        if (socketGame) {
            socketGame.on('Invitation', (invitation: invitation) => {
                if (invitation.send === true) {
                    console.log('Invitation Received', invitation);
                    setAsker(invitation.by);
                }
            });
        }
    }, [socketGame]);

    const acceptInvitation = () => {
        
    }

    const declineInvitation = () => {

    }

    return (
        <div id="PopUp" className={asker == null ? "hide" : ""}>
            <div>{asker} invites you to play a game</div>
            <div id="accept" onClick={acceptInvitation}>Accept</div>
            <div id="decline" onClick={declineInvitation}>Decline</div>
        </div>
    )
}

export default PopUp;