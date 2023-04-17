import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function PendingList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [pendings, setPendings] = useState<{id: string, name: string}[]>([]);

    const fetchPending = () => {
        Axios.get("listRequestsPendingSend/" + me.sub)
        .then((response) => {
            console.log("blop",response.data)
            setPendings(response.data);
        });
    }

    const cancelHandler = (e: any) => {
        socket.emit("cancelFriendRequest", e.target.value);
    }

    useEffect(() => {
        fetchPending();
        socket.on("newFriendRequestSent", (id: string, name: string) => {
            let newPendings = [...pendings, {id: id, name: name}];
            newPendings.sort((a, b) => {
                return a.name.localeCompare(b.name);
            })
            setPendings(newPendings);
        })
        socket.on("newFriend", (id: string, login: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.id != id;
            }))
        })
        socket.on("supressFriendRequest", (id: string, login: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.id != id;
            }))
        })
        return () => {
            socket.off("newFriendRequestSent");
            socket.off("newFriend");
            socket.off("supressFriendRequest");
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