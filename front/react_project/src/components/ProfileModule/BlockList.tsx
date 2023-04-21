import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faArrowDown, faArrowUp, faChainBroken, faPeace } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

export default function BlockList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [blocked, setBlocked] = useState<{id: string, name: string}[]>([]);
    const [develop, setDevelop] = useState<boolean>(false);

    const fetchBlocked = () => {
        socket.emit("listBlock");
    }

    const invertDevelop = () => {
        setDevelop(!develop);
    }

    const unblockEvent = (e : any) => {
        socket.emit("unblockUser", {id: e.currentTarget.value})
    }

    useEffect(() => {
        console.log("socket: ", socket);
        fetchBlocked();
        socket.on("listBlock", (data: {id: string, name: string}[]) => {
            setBlocked(data);
        })
    }, []);

    return (
        <div>
        {blocked.length > 0 && <div id="block">
            {blocked.length > 0 && <div id="titleBlock">
                <h3>
                    User{blocked.length > 1 && "s"} I blocked
                </h3>
                <button id="developButton" onClick={invertDevelop}>
                    {develop    ? <FontAwesomeIcon icon={faArrowUp} />
                                : <FontAwesomeIcon icon={faArrowDown} />}
                </button>
            </div>}
            {develop && <ul id="blockList">
                {blocked.map((elt, id) => (
                    <li id="blockElement" key={id}>
                        <span className="name">{elt.name}</span>
                        <NavLink id="checkProfileButton" to={`/profile/${elt.id}`}>
                            <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
                        </NavLink>
                        <button id="unblockButton" value={elt.id} onClick={unblockEvent}>
                            <FontAwesomeIcon className="iconAction" icon={faPeace} />
                        </button>
                    </li>
                ))}
            </ul>}
        </div>}
        </div>
    )
}