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
    for: string | null,
    by: string | null,
    status: string | null,
    super_game_mode: boolean,
}

const PopUp: React.FC = () => {
    const navigate = useNavigate();
    let user: User;
    const { socketGame } = React.useContext(SocketContext);
    const [invites, setInvites] = useState<invite[] | null>([]);
    const invitesRef = useRef<invite[] | null>([]);
    const [popUpContents, setPopUpContents] = useState<JSX.Element[]>([]);

    useEffect(() => {
        if (invites) {
            invitesRef.current = invites;
        }
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
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
            });

            socketGame.on("Invitation", (invitation: invitation) => {
                if (invitesRef.current!.length > 0) {
                    setInvites((prevInvites) =>
                        prevInvites!.map((invite) => {
                            if (invite.by === invitation.for && invite.for === invitation.by) {
                                if (invite.status === "send") {
                                    return {
                                        ...invite,
                                        by: invitation.by,
                                        for: invitation.for,
                                        status: "received",
                                        super_game_mode: invitation.super_game_mode,
                                    }
                                }
                                else if (invite.status === "received") {
                                    return {
                                        ...invite,
                                        by: invitation.by,
                                        for: invitation.for,
                                        status: "send",
                                        super_game_mode: invitation.super_game_mode,
                                    }
                                }
                                else if (invite.status === "declined") {
                                    return {
                                        ...invite,
                                        by: invitation.by,
                                        for: invitation.for,
                                        status: "received",
                                        super_game_mode: invitation.super_game_mode,
                                    }
                                }
                                else {
                                    return invite
                                }
                            }
                            else if (invite.by === invitation.by && invite.for === invitation.for && invite.status === "declined") {
                                return {
                                    ...invite,
                                    status: "send",
                                    super_game_mode: invitation.super_game_mode,
                                }

                            }
                            else if (invite.by === invitation.by) {
                                return invite;
                            }
                            else {
                                console.log("J'ai deja des popup mais pas le meme couple d'invite")
                                if (invitation.for === user.login) {
                                    setInvites((prevInvites) => {
                                        const newInvite = {
                                            for: invitation.for,
                                            by: invitation.by,
                                            status: "received",
                                            super_game_mode: invitation.super_game_mode
                                        };
                                        return [newInvite]
                                    })
                                }
                                else if (invitation.by === user.login) {
                                    setInvites(() => {
                                        const newInvite = {
                                            for: invitation.for,
                                            by: invitation.by,
                                            status: "send",
                                            super_game_mode: invitation.super_game_mode
                                        };
                                        return [newInvite]
                                    })
                                }
                                return invite
                            }
                        }))
                }
                else {
                    if (invitation.for === user.login) {
                        setInvites(() => {
                            const newInvite = {
                                for: invitation.for,
                                by: invitation.by,
                                status: "received",
                                super_game_mode: invitation.super_game_mode
                            };
                            return [newInvite]
                        })
                    }
                    else if (invitation.by === user.login) {
                        setInvites(() => {
                            const newInvite = {
                                for: invitation.for,
                                by: invitation.by,
                                status: "send",
                                super_game_mode: invitation.super_game_mode
                            };
                            return [newInvite]
                        })
                    }
                }
            });

            socketGame.on("Invite_Declined", (invitation: invitation) => {
                setInvites((prevInvites) =>
                    prevInvites!.map((invite) => {
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
            })

            socketGame.on('Already_On_Match', () => {
            });

            socketGame.on("Invitation_Accepted", () => {
                setInvites([]);
                navigate("/game", { state: { from: "invitation" } });
            })

            socketGame.on("Clear_Invite", (invitation: invitation) => {
                setInvites([]);
            })
        }
    }, [socketGame]);

    useEffect(() => {
        if (invites) {
            setPopUpContents([]);
            invitesRef.current!.map((invite) => {
                switch (invite?.status) {
                    case "received":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={invite.by}>
                                <div>{invite?.by} invites you to play a game</div>
                                <div id="accept" data-key={JSON.stringify(invite)} onClick={acceptInvitation}>ACCEPT</div>
                                <div id="decline" data-key={JSON.stringify(invite)} onClick={declineInvitation}>DECLINE</div>
                            </div>
                        ])
                        break;

                    case "send":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={invite.by}>
                                <div>Invitation successfully sent to {invite?.for}</div>
                                <div id="cancel_invit" data-key={JSON.stringify(invite)} onClick={cancelInvitation}>CANCEL INVITATION</div>
                            </div>
                        ])
                        break;

                    case "notSend":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={invite.by}>
                                <div>{invite?.for} is not available</div>
                                <div id="close_popUp" data-key={JSON.stringify(invite)} onClick={closePopUp}>X</div>
                            </div>
                        ])
                        break;

                    case "declined":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={invite.by}>
                                <div>{invite?.for} declined your invitation</div>
                                <div id="close_popUp" data-key={JSON.stringify(invite)} onClick={closePopUp}>X</div>
                            </div>
                        ])
                        break;

                    case "you_are_in_match":
                        setPopUpContents((prevContents) => [
                            ...prevContents,
                            <div className="container" key={invite.by}>
                                <div>You are already in a match</div>
                                <div id="close_popUp" data-key={JSON.stringify(invite)} onClick={closePopUp}>X</div>
                            </div>
                        ])
                        break;

                    default:
                        break;
                }
            })
        }
    }, [invites])

    const acceptInvitation = () => {
        socketGame.emit("Accept_Invite");
        setInvites([]);
        navigate("/game", { state: { from: "invitation" } });
    }

    const declineInvitation = (event: React.MouseEvent<HTMLDivElement>) => {
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        socketGame.emit("Decline_Invitation", { player1_login: data.by })
        setInvites(invites!.filter(invite => !(invite.by === data.by && invite.for === data.for)));
    }

    const cancelInvitation = (event: React.MouseEvent<HTMLDivElement>) => {
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        socketGame.emit("Cancel_Invitation")
        setInvites(invites!.filter(invite => !(invite.by === data.by && invite.for === data.for)));
    }

    const closePopUp = (event: React.MouseEvent<HTMLDivElement>) => {
        let data: invite = JSON.parse(event.currentTarget.getAttribute('data-key')!);
        setInvites(invites!.filter(invite => !(invite.by === data.by && invite.for === data.for)));
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