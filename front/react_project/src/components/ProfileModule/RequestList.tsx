import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function RequestsList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [requests, setRequests] = useState<{id: string, name: string}[]>([]);

    const fetchRequests = () => {
        Axios.get("listRequestsPendingReceived/" + me.sub)
        .then((response) => {
            console.log(response.data);
            setRequests(response.data);
        });
    }

    const acceptHandler = (e: any) => {
        socket.emit("acceptFriendRequest", {userId: e.target.value});
    }

    const declineHandler = (e:any) => {
        socket.emit('rejectFriendRequest', {userId: e.target.value});
    }

    useEffect(() => {
        fetchRequests();
        socket.on("newFriendRequestReceived", (id: string, name: string) => {
            let newRequests = [...requests, {id: id, name: name}];
            newRequests.sort((a, b) => {
                return a.name.localeCompare(b.name);
            })
            setRequests(newRequests);
        })
        socket.on("newFriend", (id: string, login: string) => {
            setRequests(requests.filter((elt) => {
                return elt.id != id;
            }))
        })
        socket.on("supressFriendRequest", (id: string, login: string) => {
            setRequests(requests.filter((elt) => {
                return elt.id != id;
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
                    <li className="requestElement" key={id}>{elt.name}
                    <button value={elt.id} onClick={acceptHandler} className="acceptFriendButton">-OK-</button>
                    <button value={elt.id} onClick={declineHandler} className="declineFriendButton">-NOT OK-</button></li>
                ))}
            </ul>
        </div>
    )
}