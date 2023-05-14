import "../styles/Base.css"
import "../styles/PopUp.scss"

import React, { useState, useEffect, useRef } from 'react'
import { SocketContext } from "./context"
import { useNavigate } from "react-router"
import { accountService } from "../services/account.service"
import { userService } from "../services/user.service"
import { User } from "../models"
import { JwtPayload } from "jsonwebtoken"
import { faLeaf } from "@fortawesome/free-solid-svg-icons"

interface invitation {
    for: string,
    by: string,
    send: boolean,
    super_game_mode: boolean,
}

interface invite {
    for: string | null,
    by: string | null,
    status: string | null,
    super_game_mode: boolean,
}


const PopUp: React.FC = () => {
    let skip: boolean = false;
    const navigate = useNavigate();
    let user: User;
    const { socketGame } = React.useContext(SocketContext);
    const [invites, setInvites] = useState<invite[] | null>([]);
    const invitesRef = useRef<invite[] | null>([]);
    const [popUpContents, setPopUpContents] = useState<JSX.Element[]>([]);


    ////// TODO
    // useEffect(() => {
    //     console.log("ask invite function");
    //     if (socketGame) {
    //         socketGame.emit("Ask_Invitation");
    //         console.log("ask invite send");
    //     }
    // }, [socketGame])

    useEffect(() => {

        if (invites) {
            console.log("Changes on invites")
            invitesRef.current = invites;
            console.log("invitesRef", invitesRef)
            // console.log("invite status", invite.status);
        }
        // if (invite?.status === "received") {
        //     invitesRef.current = invite;
        // }
    }, [invites])

    useEffect(() => {
        if (socketGame) {
            socketGame.on("Connection_Accepted", () => {
                if (accountService.isLogged()) {
                    let decodedToken: JwtPayload = accountService.readPayload()!;
                    const id = decodedToken.sub;
                    userService.getUserWithAvatar(id!)
                        .then(response => {
                            user = response.data;
                            socketGame.emit("Ask_Invitation", { player1_login: user.login });
                            console.log("ask invite send");
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            });

            socketGame.on("Invitation", (invitation: invitation) => {

                console.log("invitesRef.current", invitesRef.current)
                console.log("user login", user.login)
                console.log("invitation received", invitation)

                // setInvites(invites!.filter(invite => (invite.status !== "notSend" && invite.status !== "declined" && invite.status !== "you_are_in_match")))

                invitesRef.current!.map((invite) => {
                    console.log("ICI 1");
                    if ((invite.by === invitation.by && invite.for === invitation.for) || (invite.by === invitation.for && invite.for === invitation.by)) {
                        console.log("ICI 2");
                        setInvites((prevInvites) =>
                        prevInvites!.map((invite) => {
                            if (invite.by === user.login || invite.for === user.login) {
                                if (invitation.by === user.login) {
                                    console.log("j'envoie linvitation", invite.for, user.login)
                                    return {
                                        for: invitation.for,
                                        by: invitation.by,
                                        status: invitation.send === true ? "send" : "notSend",
                                        super_game_mode: invitation.super_game_mode
                                    };
                                }
                                else {
                                    console.log("je recois", invite.for, user.login)
                                    return {
                                        for: invitation.for,
                                        by: invitation.by,
                                        status: "received",
                                        super_game_mode: invitation.super_game_mode
                                    };
                                }
                            }
                            else {
                                return invite;
                            }
                        }))
                        console.log("Je veux return");
                        skip = true;
                        return;
                    }
                })

                if (skip == true) {
                    skip = false;
                    return;
                }
                console.log("ICI 3");

                if (invitation.for === user?.login) {
                    console.log("Cette invitation m'est destinee");
                    // if (invitesRef.current != null) {
                        invites!.map((inviteRef) => {
                            if (inviteRef.by === invitation.by && inviteRef.for === invitation.for) {
                                // invitesRef.current = invitesRef.current!.filter(inviteRef => inviteRef.by === invitation.by && inviteRef.for === invitation.for)
                                setInvites(invites!.filter(invite => invite.by === invitation.by && invite.for === invitation.for));
                                console.log("Invitation has been canceled by asker", invitation);
                                return ;
                            }
                        })
                    // }




                    setInvites((prevInvites) => {
                        const newInvite = {
                            for: invitation.for,
                            by: invitation.by,
                            status: "received",
                            super_game_mode: invitation.super_game_mode
                        };

                        invitesRef.current?.map((invite) => {
                            if (invite.by === invitation.by && invite.for === invitation.for) {
                                return;
                            }
                        })
                        
                        // console.log("Invitation Received", invitation);
                        if (prevInvites === null) {
                            console.log("Premiere invite ajoutee");
                            return [newInvite]; // Initialize the array with the new invite
                        }
                        else {
                            console.log("Invite ajoutee au tab d'invites");
                            return [...prevInvites, newInvite]; // Add the new invite to the existing array
                        }
                    });
                }
                
                if (invitation.by === user.login) {
                    console.log("J'ai envoye cette invite");
                    setInvites((prevInvites) => {
                        const newInvite = {
                            for: invitation.for,
                            by: invitation.by,
                            status: invitation.send === true ? "send" : "notSend",
                            super_game_mode: invitation.super_game_mode
                        };
                        
                        // console.log("Invitation Received", invitation);
                        if (prevInvites === null) {
                            console.log("Premiere invite ajoutee");
                            return [newInvite]; // Initialize the array with the new invite
                        }
                        else {
                            console.log("Invite ajoutee au tab d'invites");
                            return [...prevInvites, newInvite]; // Add the new invite to the existing array
                        }
                    });

                }
            });

            socketGame.on("Players", () => {
                console.log('Player info received');
            })

            socketGame.on("Invite_Declined", (invitation: invitation) => {
                console.log("invite declined request");
                // setInvites(invites!.filter(invite => (invite.status !== "notSend" && invite.status !== "declined" && invite.status !== "you_are_in_match")))
                setInvites((prevInvites) =>
                    prevInvites!.map((invite) => {
                        // if (invite.status === "notSend" || invite.status === "declined" || invite.status === "you_are_in_match") {
                        //     return {
                        //         ...invite,
                        //         by: null,
                        //         for: null,
                        //         status: null,
                        //     };
                        // }
                        if (invite.by === invitation.by && invite.for === invitation.for) {
                            return {
                                ...invite,
                                status: "declined",
                            };
                        }
                        else {
                            return invite;
                        }
                    }))

                // setInvite((prevState) => ({
                //     ...prevState!,
                //     status: "declined",
                // }));

                // }
            })

            socketGame.on('Already_On_Match', () => {
                console.log('Already on match');
                setInvites(
                    [
                        {
                            by: "",
                            for: "",
                            status: "you_are_in_match",
                            super_game_mode: false,
                        }
                    ]
                );
                // setInvites((prevState) => ({
                //     ...prevState!,
                //     status: "you_are_in_match",
                // }));
            });

            socketGame.on("Invitation_Accepted", () => {
                // if (invite?.status === "send") {
                console.log("invite has been accepted by target");
                setInvites([]);
                // invitesRef.current = null;
                navigate("/game", { state: { from: "invitation" } });
                // setInvites(null);
                // invitesRef.current = null;
                // navigate("/game", {state : {from : "invitation"}});
                // }
            })

            socketGame.on("Clear_Invite", (invitation: invitation) => {
                console.log("clear invite request", invitation);
                console.log("clear invite request", invites);
                console.log("clear invite request", invitesRef.current);
                setInvites(invitesRef.current!.filter(invite => !(invite.by === invitation.by && invite.for === invitation.for)));
                // invitesRef.current = invitesRef.current!.filter(inviteRef => inviteRef.by === invitation.by && inviteRef.for === invitation.for)
                // setInvite(null);
                // invitesRef.current = null;
            })
        }
    }, [socketGame]);

    useEffect(() => {
        if (invites) {
            setPopUpContents([]);
            invites?.map((invite) => {
                let key: number = 0;
                console.log("add html to popup list. status is :", invite.status);
                console.log("invites lenght", invites.length);
                switch (invite?.status) {
                    case "received":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={key}>
                                <div>{invite?.by} invites you to play a game</div>
                                <div id="accept" data-key={JSON.stringify(invite)} onClick={acceptInvitation}>ACCEPT</div>
                                <div id="decline" data-key={JSON.stringify(invite)} onClick={declineInvitation}>DECLINE</div>
                            </div>
                        ])
                        break;

                    case "send":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={key}>
                                <div>Invitation successfully sent to {invite?.for}</div>
                                <div id="cancel_invit" data-key={JSON.stringify(invite)} onClick={cancelInvitation}>CANCEL INVITATION</div>
                            </div>
                        ])
                        break;

                    case "notSend":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={key}>
                                <div>{invite?.for} is not available</div>
                                <div id="close_popUp" data-key={JSON.stringify(invite)} onClick={closePopUp}>X</div>
                            </div>
                        ])
                        break;

                    case "declined":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={key}>
                                <div>{invite?.for} declined your invitation</div>
                                <div id="close_popUp" data-key={JSON.stringify(invite)} onClick={closePopUp}>X</div>
                            </div>
                        ])
                        break;

                    case "you_are_in_match":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={key}>
                                <div>You are already in a match</div>
                                <div id="close_popUp" data-key={JSON.stringify(invite)} onClick={closePopUp}>X</div>
                            </div>
                        ])
                        break;

                    default:
                        break;

                    }
                key++;
            })
        }
    }, [invites])

    const acceptInvitation = (event: React.MouseEvent<HTMLDivElement>) => {
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        console.log("accept invite");
        socketGame.emit("Private_Matchmaking", { target: data.by, super_game_mode: data.super_game_mode });
        setInvites([]);
        // invitesRef.current = null;
        navigate("/game", { state: { from: "invitation" } });
    }
    
    const declineInvitation = (event: React.MouseEvent<HTMLDivElement>) => {
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        console.log("decline invite");
        socketGame.emit("Decline_Invitation", { player1_login: data.by })
        setInvites(invites!.filter(invite => !(invite.by === data.by && invite.for === data.for)));
        // invitesRef.current = null;
    }
    
    const cancelInvitation = (event: React.MouseEvent<HTMLDivElement>) => {
        console.log("cancel invite", JSON.parse(event.currentTarget.getAttribute('data-key')!));
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        console.log("cancel invite");
        socketGame.emit("Cancel_Invitation")
        setInvites(invites!.filter(invite => !(invite.by === data.by && invite.for === data.for)));
        // setInvite(null);
    }
    
    const closePopUp = (event: React.MouseEvent<HTMLDivElement>) => {
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        setInvites(invites!.filter(invite => !(invite.by === data.by && invite.for === data.for)));
        // setInvite(null);
    }

    return (
        <div id="PopUp" className={invites?.length === 0 ? "hide" : ""}>
            {
                popUpContents.map((popUp) => {
                    return popUp;
                })
            }
        </div>
    )
}

export default PopUp;