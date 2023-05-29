import { useContext, useEffect, useRef, useState } from "react";
import { SocketContext } from "./context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../services/account.service";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGamepad, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function ProposeGame() {
    const { socket } = useContext(SocketContext);
    const { socketGame } = useContext(SocketContext);
    const [filtered, setFiltered] = useState<{ id: string, login: string }[]>([]);
    const [gameType, setGameType] = useState<string>("normal");

    const proposeGame = (event: any) => {
        if (gameType === "normal")
            socketGame.emit("Private_Matchmaking", { target: event.target.value, super_game_mode: false });
        else if (gameType === "super")
            socketGame.emit("Private_Matchmaking", { target: event.target.value, super_game_mode: true });
    }

    const changeType = (e: any) => {
        setGameType(e.target.value);
    }

    useEffect(() => {
        if (socket) {
            socket.emit("listConnectedUsers");
            socket.on("allConnectedUsers", (users: { userId: string, userLogin: string }[]) => {
                const payload: JwtPayload = accountService.readPayload()!;
                let newUserList: { id: string, login: string }[] = [];
                users.forEach((user) => {
                    if (payload.sub != user.userId)
                        newUserList.push({ id: user.userId, login: user.userLogin });
                });
                newUserList.sort((a, b) => { return a.login.localeCompare(b.login); });
                console.log(newUserList);
                setFiltered(newUserList);
            })

            return () => {
                socket.off("allConnectedUsers");
            }
        }
    }, [socket]);

    return (
        <div id="proposeGame">
            <h2>Propose a game</h2>
            <div className="buttons">
                <button className={gameType == "normal" ? "button push" : "button"} value="normal" onClick={changeType}>normal</button>
                <FontAwesomeIcon className="iconAction" icon={faGamepad} />
                <button className={gameType == "super" ? "button push" : "button"} value="super" onClick={changeType}>super</button>
            </div>
            <ul>
                {filtered.map((elt: { id: string, login: string }, id: number) => (
                    <li className="searchElement" key={elt.id}>
                        <button value={elt.login} onClick={proposeGame}>{elt.login}</button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const SearchbarGame: React.FC = () => {
    const { socket } = useContext(SocketContext);
    const { socketGame } = useContext(SocketContext);
    const ref = useRef<HTMLUListElement>(null);
    const [text, setText] = useState<string>("");
    const [isDropdown, setIsDropdown] = useState<boolean>(false);
    const [filtered, setFiltered] = useState<{ id: string, login: string }[]>([]);
    const [gameType, setGameType] = useState<string>("normal");

    const proposeGame = (event: any) => {
        if (gameType === "normal")
            socketGame.emit("Private_Matchmaking", { target: event.target.value, super_game_mode: false });
        else if (gameType === "super")
            socketGame.emit("Private_Matchmaking", { target: event.target.value, super_game_mode: true });
        resetFiltered();
    }

    const showSearchList = (event: any) => {
        socket.emit("listConnectedUsers");
        setIsDropdown(true);
        displayList(event);
    }

    const displayList = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log("je tape");
        setText(event.target.value);

        if (event.target.value) {
            setFiltered(() => {
                const filteredUsers: { id: string, login: string }[] =
                    filtered.filter((user: { id: string, login: string }) =>
                        user.login.startsWith(event.target.value));
                return filteredUsers;
            });
        }
    }

    const resetFiltered = () => {
        setText("");
        setFiltered([]);
        setIsDropdown(false);
    }

    const closeSearchList = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            setIsDropdown(false);
        }
    }

    const changeType = (e: any) => {
        setGameType(e.target.value);
    }

    useEffect(() => {
        if (socket) {
            socket.on("allConnectedUsers", (users: { userId: string, userLogin: string }[]) => {
                const payload: JwtPayload = accountService.readPayload()!;
                let newUserList: { id: string, login: string }[] = [];
                users.forEach((user) => {
                    if (payload.sub != user.userId)
                        newUserList.push({ id: user.userId, login: user.userLogin });
                });
                newUserList.sort((a, b) => { return a.login.localeCompare(b.login); });
                setFiltered(newUserList);
            })

            return () => {
                socket.off("allConnectedUsers");
            }
        }
    }, [socket]);

    useEffect(() => {
        document.addEventListener("mousedown", closeSearchList);
        return () => {
            document.removeEventListener("mousedown", closeSearchList);
        }
    }, [ref]);

    return (
        <div id="proposeGame">
            <h2>Propose a game</h2>
            <div className="buttons">
                <button className={gameType == "normal" ? "button push" : "button"} value="normal" onClick={changeType}>normal</button>
                <FontAwesomeIcon className="iconAction" icon={faGamepad} />
                <button className={gameType == "super" ? "button push" : "button"} value="super" onClick={changeType}>super</button>
            </div>
            <div id="searchbarWrapper">
                <div className="searchbar">
                    <input type="text" onChange={displayList} onClick={showSearchList} value={text} placeholder="Search..." />
                    <FontAwesomeIcon className="svgSearch" icon={faMagnifyingGlass} />
                </div>
                {(filtered.length != 0 && isDropdown) &&
                    <ul ref={ref}>
                        {filtered.map((elt: { id: string, login: string }, id: number) => (
                            <li className="searchElement" key={elt.id}>
                                <button value={elt.login} onClick={proposeGame}>{elt.login}</button>
                            </li>
                        ))}
                    </ul>}
            </div>
        </div>
    )
}

export default SearchbarGame;