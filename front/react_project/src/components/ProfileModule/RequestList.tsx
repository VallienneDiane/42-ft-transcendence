import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function RequestsList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [requests, setRequests] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);

    const fetchRequests = () => {
        Axios.get("listRequestsPendingReceived/" + me.sub)
        .then((response) => {
            console.log(response.data);
            setRequests(response.data);
        });
    }

    const acceptHandler = (e: any) => {
        socket.emit("acceptFriendRequest", {friendshipId: e.target.value});
    }

    const declineHandler = (e:any) => {
        socket.emit('rejectFriendRequest', {friendshipId: e.target.value});
    }

    useEffect(() => {
        fetchRequests();
        socket.on("newFriendRequestReceived", (friendshipId: string, id: string, name: string) => {
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
        return () => {
            socket.off("newFriendRequestReceived");
            socket.off("newFriend");
            socket.off("supressFriendRequest");
        }
    }, []);

    return (
        <div id="requestList">
            {requests.length > 0 && <h3>Request{requests.length > 1 && "s"} I received</h3>}
            <ul>
                {requests.map((elt, id) => (
                    <li className="requestElement" key={id}>{elt.friendName}
                    <button value={elt.friendshipId} onClick={acceptHandler} className="acceptFriendButton">-OK-</button>
                    <button value={elt.friendshipId} onClick={declineHandler} className="declineFriendButton">-NOT OK-</button></li>
                ))}
            </ul>
        </div>
    )
}