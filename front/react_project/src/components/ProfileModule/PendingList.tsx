import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function PendingList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [pendings, setPendings] = useState<{id: string, name: string}[]>([]);

    const fetchFriends = () => {
        Axios.get("listRequestsPendingSend/" + me.sub)
        .then((response) => {
            setPendings(response.data);
        });
    }

    useEffect(() => {
        fetchFriends();
    }, []);

    return (
        <div>
            {pendings.length > 0 && <h3>My pending request{pendings.length > 1 && "s"}</h3>}
            <ul className="friendList">
                {pendings.map((elt, id) => (
                    <li className="friendElement" key={id}>{elt.name}</li>
                ))}
            </ul>
        </div>
    )
}