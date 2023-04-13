import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

export default function BlockList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [blocked, setBlocked] = useState<{id: string, name: string}[]>([]);

    const fetchBlocked = () => {
        socket.emit("listBlock");
    }

    useEffect(() => {
    }, []);

    return (
        <div className="requestList">
            {blocked.length > 0 && <h3>Request{blocked.length > 1 && "s"} I received</h3>}
            <ul>
                {blocked.map((elt, id) => (
                    <li className="friendElement" key={id}>{elt.name}</li>
                ))}
            </ul>
        </div>
    )
}