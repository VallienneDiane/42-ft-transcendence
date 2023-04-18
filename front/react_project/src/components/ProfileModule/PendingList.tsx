import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function PendingList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [pendings, setPendings] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);

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
        return () => {
            socket.off("newFriendRequestSent");
            socket.off("newFriend");
            socket.off("supressFriendRequest");
            socket.off("supressFriend");
        }
    }, []);

    return (
        <div id="pending">
            {pendings.length > 0 && <h3 id="titlePending">My pending request{pendings.length > 1 && "s"}</h3>}
            <ul>
                {pendings.map((elt) => (
                    <li className="pendingElement" key={elt.friendId}>{elt.friendName}<button value={elt.id} onClick={cancelHandler} className="cancelRequestButton">cancel</button></li>
                ))}
            </ul>
        </div>
    )
}