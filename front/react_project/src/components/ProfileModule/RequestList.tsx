import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp, faCheck, faCheckSquare, faThumbsDown, faThumbsUp } from "@fortawesome/free-solid-svg-icons";

export default function RequestsList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [requests, setRequests] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);
    const [develop, setDevelop] = useState<boolean>(false);

    const fetchRequests = () => {
        Axios.get("listRequestsPendingReceived/" + me.sub)
        .then((response) => {
            console.log(response.data);
            setRequests(response.data);
        });
    }

    const invertDevelop = () => {
        setDevelop(!develop);
    }

    const acceptHandler = (e: any) => {
        socket.emit("acceptFriendRequest", {friendshipId: e.target.value});
    }

    const declineHandler = (e:any) => {
        socket.emit('rejectFriendRequest', {friendshipId: e.target.value});
    }

    useEffect(() => {
        fetchRequests();
    }, [])

    useEffect(() => {
        socket.on("newFriendRequestReceived", (friendshipId: string, id: string, name: string) => {
            console.log(name, "send me a friend request");
            let newRequests = [...requests, {friendshipId: friendshipId, friendId: id, friendName: name}];
            newRequests.sort((a, b) => {
                return a.friendName.localeCompare(b.friendName);
            })
            setRequests(newRequests);
        })
        socket.on("newFriend", (friendshipId: string, id: string, login: string) => {
            setRequests(requests.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        })
        socket.on("supressFriendRequest", (friendshipId: string) => {
            setRequests(requests.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        })
        socket.on("supressFriend", (friendshipId: string) => {
            setRequests(requests.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        })
    }, [requests]);

    return (
        <div id="request">
            {requests.length > 0 &&
            <div id="titleRequest">
                <h3>Request{requests.length > 1 && "s"} I received</h3>
                <button id="developButton" onClick={invertDevelop}>
                    {develop    ? <FontAwesomeIcon icon={faArrowUp} />
                                : <FontAwesomeIcon icon={faArrowDown} />}
                </button>
            </div>}
            {develop && <ul id = "requestList">
                {requests.map((elt) => (
                    <li className="requestElement" key={elt.friendshipId}><span>{elt.friendName}</span>
                    <button value={elt.friendshipId} onClick={acceptHandler} className="acceptFriendButton">
                        <FontAwesomeIcon icon={faThumbsUp} />
                    </button>
                    <button value={elt.friendshipId} onClick={declineHandler} className="declineFriendButton">
                        <FontAwesomeIcon icon={faThumbsDown} />
                    </button></li>
                ))}
            </ul>}
        </div>
    )
}