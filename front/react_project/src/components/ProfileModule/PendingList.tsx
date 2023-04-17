import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function PendingList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [pendings, setPendings] = useState<{friendshipId: string, id: string, name: string}[]>([]);

    const fetchPending = () => {
        Axios.get("listRequestsPendingSend/" + me.sub)
        .then((response) => {
            setPendings(response.data);
        });
    }

    const cancelHandler = (e: any) => {
        socket.emit("cancelFriendRequest", {friendshipId: e.target.value});
    }

    useEffect(() => {
        fetchPending();
        socket.on("newFriendRequestSent", (friendshipId: string, id: string, name: string) => {
            let newPendings = [...pendings, {friendshipId: friendshipId, id: id, name: name}];
            newPendings.sort((a, b) => {
                return a.name.localeCompare(b.name);
            })
            setPendings(newPendings);
        })
        socket.on("newFriend", (friendshipId: string, id: string, login: string) => {
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
        return () => {
            socket.off("newFriendRequestSent");
            socket.off("newFriend");
            socket.off("supressFriendRequest");
            socket.off("supressFriend");
        }
    }, []);

    return (
        <div className="pendingList">
            {pendings.length > 0 && <h3>My pending request{pendings.length > 1 && "s"}</h3>}
            <ul>
                {pendings.map((elt, id) => (
                    <li className="pendingElement" key={id}>{elt.name}<button value={elt.id} onClick={cancelHandler} className="cancelRequestButton">cancel</button></li>
                ))}
            </ul>
        </div>
    )
}