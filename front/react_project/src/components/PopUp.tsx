import "../styles/Base.css"
import "../styles/PopUp.scss"

import React, { useState, useEffect } from 'react'
import { SocketContext } from "./context"
import { Socket } from 'socket.io-client'
import { DefaultEventsMap } from "@socket.io/component-emitter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

interface invitation {
    for: string,
    by: string,
    send: boolean
}


const PopUp: React.FC = (props) => {
    const {socketGame} = React.useContext(SocketContext);

    useEffect(() => {
        // triggered when receiving socketGame data, update position of elements
        if (socketGame) {
            socketGame.on('Invitation', (invitation: invitation) => {
                console.log('Invitation Received', invitation);
            });
        }
    }, [socketGame]);

    return (
        <div id="PopUp">
            
        </div>
    )
}

export default PopUp;