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

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="requestList">
            {requests.length > 0 && <h3>Request{requests.length > 1 && "s"} I received</h3>}
            <ul>
                {requests.map((elt, id) => (
                    <li className="friendElement" key={id}>{elt.name}</li>
                ))}
            </ul>
        </div>
    )
}