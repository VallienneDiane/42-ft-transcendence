import "../styles/Base.css"
import "../styles/PopUp.scss"

import React, { useState, useEffect, useRef } from 'react'
import { SocketContext } from "./context"
import { useNavigate } from "react-router"
import { accountService } from "../services/account.service"
import { userService } from "../services/user.service"
import { User } from "../models"
import { JwtPayload } from "jsonwebtoken"

interface invitation {
    for: string,
    by: string,
    send: boolean,
    super_game_mode: boolean,
}

interface invite {
    for: string,
    by: string,
    status: string,
    super_game_mode: boolean,
}


const PopUp: React.FC = () => {
    const navigate = useNavigate();
    let user: User;
    const {socketGame} = React.useContext(SocketContext);
    const [invite, setInvite] = useState<invite | null>();
    const inviteRef = useRef<invite | null>(null);
    const [popUpContent, setPopUpContent] = useState<JSX.Element>();

    
    ////// TODO
    // useEffect(() => {
    //     console.log("ask invite function");
    //     if (socketGame) {
    //         socketGame.emit("Ask_Invitation");
    //         console.log("ask invite send");
    //     }
    // }, [socketGame])
    
    useEffect(() => {
        if (invite) {
            console.log("invite status", invite.status);
        }
        if (invite?.status === "received") {
            inviteRef.current = invite;
        }
    }, [invite])
    
    useEffect(() => {
        if (socketGame) {
            socketGame.on("Connection_Accepted", () => {
                if (accountService.isLogged()) {
                    let decodedToken: JwtPayload = accountService.readPayload()!;
                    const id = decodedToken.sub;
                    userService.getUserWithAvatar(id!)
                    .then(response => {
                        user = response.data;
                        socketGame.emit("Ask_Invitation", {player1_login: user.login});
                        console.log("ask invite send");
                    })
                    .catch(error => {
                        console.log(error);
                    });
                }
            });

            socketGame.on("Invitation", (invitation: invitation) => {
                
                console.log("inviteRef.current", inviteRef.current)
                console.log("user login", user.login)
                console.log("invitation received", invitation)
                if (inviteRef.current != null && invitation.by === inviteRef.current!.by && invitation.for === inviteRef.current!.for) {
                    setInvite(null);
                    inviteRef.current = null;
                    console.log("Invitation has been canceled by asker", invitation);
                }
                else if (invitation.for === user?.login) {
                    setInvite({for: invitation.for, by: invitation.by, status: "received", super_game_mode: invitation.super_game_mode});
                    console.log("Invitation Received", invitation);
                }
                if (invitation.send === true && invitation.by === user?.login) {
                    setInvite({for: invitation.for, by: invitation.by, status: "send", super_game_mode: invitation.super_game_mode});
                    console.log("Invitation successfuly sent" , invitation);
                }
                if (invitation.send === false && invitation.by === user?.login) {
                    setInvite({for: invitation.for, by: invitation.by, status: "notSend", super_game_mode: invitation.super_game_mode});
                    console.log("Invitation not send", invitation);
                }
            });
            
            socketGame.on("Players", () => {
                console.log('Player info received');
            })
            
            socketGame.on("Invite_Declined", () => {
                console.log("invite declined request");
            // if (invite?.status === "send") {
                setInvite((prevState) => ({
                    ...prevState!,
                    status: "declined",
                }));
                // }
            })
            
            socketGame.on('Already_On_Match', () => {
                console.log('Already on match');
                setInvite((prevState) => ({
                    ...prevState!,
                    status: "you_are_in_match",
                }));
            });
            
            socketGame.on("Invitation_Accepted", () => {
            // if (invite?.status === "send") {
                console.log("invite has been accepted by target");
                setInvite(null);
                inviteRef.current = null;
                navigate("/game", {state : {from : "invitation"}});
                // }
            })
            
            socketGame.on("Clear_Invite", () => {
                console.log("clear invite request");
                setInvite(null);
                inviteRef.current = null;
            })
        }
    }, [socketGame]);

    useEffect(() => {
        if (invite) {
            switch (invite?.status) {
                case "received":
                    setPopUpContent(
                        <div className="container">
                        <div>{invite?.by} invites you to play a game</div>
                        <div id="accept" onClick={acceptInvitation}>Accept</div>
                        <div id="decline" onClick={declineInvitation}>Decline</div>
                    </div>
                  );
                  break;
                  
                  case "send":
                      setPopUpContent(
                    <div className="container">
                        <div>Invitation successfully sent to {invite?.for}</div>
                        <div onClick={cancelInvitation}>Cancel invitation</div>
                    </div>
                  );
                  break;
                  
                  case "notSend":
                      setPopUpContent(
                          <div className="container">
                        <div>{invite?.for} is not available</div>
                        <div id="close_popUp" onClick={closePopUp}>X</div>
                    </div>
                  );
                  break;

                case "declined":
                  setPopUpContent(
                    <div className="container">
                      <div>{invite?.for} declined your invitation</div>
                      <div id="close_popUp" onClick={closePopUp}>X</div>
                    </div>
                  );
                  break;

                case "you_are_in_match":
                  setPopUpContent(
                    <div className="container">
                      <div>You are already in a match</div>
                      <div id="close_popUp" onClick={closePopUp}>X</div>
                    </div>
                  );
                  break;

                default:
                    break;
                }
        }
    }, [invite])
    
    const acceptInvitation = () => {
        console.log("accept invite");
        socketGame.emit("Private_Matchmaking", {target: invite?.by, super_game_mode: invite?.super_game_mode});
        setInvite(null);
        inviteRef.current = null;
        navigate("/game", {state : {from : "invitation"}});
    }
    
    const declineInvitation = () => {
        console.log("decline invite");
        socketGame.emit("Decline_Invitation", {player1_login: invite?.by})
        setInvite(null);
        inviteRef.current = null;
    }
    
    const cancelInvitation = () => {
        console.log("cancel invite");
        socketGame.emit("Cancel_Invitation")
        setInvite(null);
    }
    
    const closePopUp = () => {
        setInvite(null);
    }
    
    return (
        <div id="PopUp" className={invite == null ? "hide" : ""}>
            {popUpContent}
        </div>
    )
}

export default PopUp;