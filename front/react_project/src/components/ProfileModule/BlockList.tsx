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

    const unblockEvent = (e : any) => {
        socket.emit("unblockUser", {id: e.target.value})
    }

    useEffect(() => {
        console.log("socket: ", socket);
        fetchBlocked();
        socket.on("listBlock", (data: {id: string, name: string}[]) => {
            setBlocked(data);
        })
    }, []);

    return (
        <div className="blockList">
            {blocked.length > 0 && <h3>User{blocked.length > 1 && "s"} I blocked</h3>}
            <ul>
                {blocked.map((elt, id) => (
                    <li className="blockElement" key={id}>{elt.name}<button className="unblockButton" value={elt.id} onClick={unblockEvent}>unblock</button></li>
                ))}
            </ul>
        </div>
    )
}