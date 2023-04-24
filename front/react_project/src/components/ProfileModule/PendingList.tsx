import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faArrowDown, faArrowUp, faCancel } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

export default function PendingList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [pendings, setPendings] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);
    const [develop, setDevelop] = useState<boolean>(false);

    const fetchPending = () => {
        Axios.get("listRequestsPendingSend/" + me.sub)
        .then((response) => {
            setPendings(response.data);
        });
    }

    const invertDevelop = () => {
        setDevelop(!develop);
    }

    const cancelHandler = (e: any) => {
        socket.emit("cancelFriendRequest", {friendshipId: e.currentTarget.value});
    }

    useEffect(() => {
        fetchPending();
    })

    useEffect(() => {
        socket.on("newFriendRequestSent", (friendshipId: string, friendId: string, friendName: string) => {
            let newPendings = [...pendings, {friendshipId: friendshipId, friendId: friendId, friendName: friendName}];
            newPendings.sort((a, b) => {
                return a.friendName.localeCompare(b.friendName);
            })
            setPendings(newPendings);
        })
        socket.on("newFriend", (friendshipId: string, friendId: string, friendName: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        })
        socket.on("supressFriendRequest", (friendshipId: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        })
        socket.on("supressFriend", (friendshipId: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        })
    }, [pendings]);

    return (
            pendings.length > 0 && <div id="pending">
            <div id="titlePending">
                <h3>
                    My pending request{pendings.length > 1 && "s"}
                </h3>
                <button id="developButton" onClick={invertDevelop}>
                    {develop    ? <FontAwesomeIcon icon={faArrowUp} />
                                : <FontAwesomeIcon icon={faArrowDown} />}
                </button>
            </div>
            {develop && <ul id="pendingList">
                {pendings.map((elt) => (
                    <li id="pendingElement" key={elt.friendId}>
                        <span className="name">{elt.friendName}</span>
                        <NavLink id="checkProfileButton" to={`/profile/${elt.friendId}`}>
                            <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
                        </NavLink>
                        <button value={elt.friendshipId} onClick={cancelHandler} id="cancelRequestButton">
                            <FontAwesomeIcon className="iconAction" icon={faCancel} />
                        </button>
                    </li>
                ))}
            </ul>}
        </div>
    )
}