import { useContext, useEffect, useRef, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCancel, faCaretDown, faCaretUp, faCommentDots, faGamepad, faMagnifyingGlass, faPeace, faThumbsDown, faThumbsUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { userService } from "../../services/user.service";

function SearchbarFriend(props: {
    friendList: {key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[], 
    requestSend: {friendshipId: string, friendId: string, friendName: string}[], 
    blockList: {id: string, name: string}[]
}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLUListElement>(null);
    const [text, setText] = useState<string>("");
    const [isDropdown, setIsDropdown] = useState<boolean>(false);
    const [filtered, setFiltered] = useState<{ id: string, login: string }[]>([]);

    const addFriend = (event: any) => {
        socket.emit("friendRequest", {userId: event.target.value});
        resetFiltered();
    }

    const showSearchList = (event: any) => {
        fetchUsers();
        setIsDropdown(!isDropdown);
        displayList(event);
    }

    const fetchUsers = () => {
        userService.getAllUsers()
        .then(response => {
            const payload: JwtPayload = accountService.readPayload()!;
            const users = new Map<string, string>();
            response.data.forEach((user: {id: string, login: string}) => users.set(user.id, user.login));
            let newUserList: { id: string, login: string }[] = [];
            users.forEach((login, id) => {
                let ok: boolean = true;
                if (payload.sub == id)
                    ok = false;
                else {
                    for (let elt of props.friendList) {
                        if (elt.friendId == id)
                            ok = false;
                    }
                    for (let elt of props.requestSend) {
                        if (elt.friendId == id)
                            ok = false;
                    }
                    for (let elt of props.blockList) {
                        if (elt.id == id)
                            ok = false;
                    }
                }   
                if (ok)
                    newUserList.push({id: id, login: login});
            });
            newUserList.sort((a, b) => {return a.login.localeCompare(b.login);});
            // console.log("fetchUsers", newUserList);
            setFiltered(newUserList);
        })
        .catch(error => { console.log(error); })
    }

    const displayList = (event: any) => {
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
        setIsDropdown(!isDropdown);
    }

    const closeSearchList = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            setIsDropdown(!isDropdown);
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", closeSearchList);
        return () => {
            document.removeEventListener("mousedown", closeSearchList);
        }
    }, [ref]);
    
    return (
        <div id="searchbarWrapper">
            <div className="searchbar">
                <input type="text" onChange={displayList} onClick={showSearchList} value={text} placeholder="Add new friend..."/>
                <FontAwesomeIcon className="svgSearch" icon={faMagnifyingGlass} />
            </div>
            {(filtered.length != 0 && isDropdown) &&
            <ul ref={ref}>
                {filtered.map((elt: { id: string, login: string }, id: number) => (
                    <li className="searchElement" key={elt.id}>
                        <button value={elt.id} onClick={addFriend}>{elt.login}</button>
                    </li>
                ))}
            </ul>}
        </div>
    )
}

export default function FriendManagement() {
    const {socket} = useContext(SocketContext);
    const {socketGame} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [friends, setFriends] = useState<{key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[]>([]);
    const [developFriend, setDevelopFriend] = useState<boolean>(true);
    const [askIfConnectedDone, setAsk] = useState<boolean>(false);
    const [fetchDone, setFetch] = useState<boolean>(false);
    const [requestDone, setRequestDone] = useState<boolean>(false);
    const [blockDone, setBlockDone] = useState<boolean>(false);
    const [pendings, setPendings] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);
    const [developPending, setDevelopPending] = useState<boolean>(true);
    const [requests, setRequests] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);
    const [developRequest, setDevelopRequest] = useState<boolean>(true);
    const [blocked, setBlocked] = useState<{id: string, name: string}[]>([]);
    const [developBlock, setDevelopBlock] = useState<boolean>(false);
    const [bugReactHook, setBugReactHook] = useState<boolean>(false);

    const fetchFriends = () => {
        Axios.get("listFriends/" + me.sub)
        .then((response) => {
            let friendsArray: {key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[] = [];
            for (let elt of response.data) {
                let toPush: {key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean} = {
                    key: elt.friendId,
                    friendshipId: elt.friendshipId,
                    friendId: elt.friendId,
                    friendName: elt.friendName,
                    isConnected: false};
                    toPush.key.concat('0');
                    friendsArray.push(toPush);
                }
            friendsArray.sort((a, b) => {return a.friendName.localeCompare(b.friendName)})
            setFriends(friendsArray);
            setFetch(true);
        });
    }

    const fetchPending = () => {
        Axios.get("listRequestsPendingSend/" + me.sub)
        .then((response) => {
            setPendings(response.data);
            setRequestDone(true);
        });
    }

    const invertDevelopPending = () => {
        setDevelopPending(!developPending);
    }

    const cancelHandler = (e: any) => {
        socket.emit("cancelFriendRequest", {friendshipId: e.currentTarget.value});
    }

    const unfriendHandler = (e: any) => {
        socket.emit("unfriend", {friendshipId: e.currentTarget.value});
    }

    const proposeGame = (event: any) => {
        if (event.currentTarget.getAttribute('data-type') === "normal")
            socketGame.emit("Private_Matchmaking", {target: event.target.value, super_game_mode: false});
        else if (event.currentTarget.getAttribute('data-type') === "super")
            socketGame.emit("Private_Matchmaking", {target: event.target.value, super_game_mode: true});
    }

    const invertDevelopFriend = () => {
        setDevelopFriend(!developFriend);
        if (!developFriend)
            askIfConnected();
    }

    const fetchRequests = () => {
        Axios.get("listRequestsPendingReceived/" + me.sub)
        .then((response) => {
            setRequests(response.data);
        });
    }

    const invertDevelopRequest = () => {
        setDevelopRequest(!developRequest);
    }

    const acceptHandler = (e: any) => {
        socket.emit("acceptFriendRequest", {friendshipId: e.currentTarget.value});
    }

    const declineHandler = (e:any) => {
        socket.emit('rejectFriendRequest', {friendshipId: e.currentTarget.value});
    }

    const changeLoc = (e: any) => {
        socket.emit("changeLoc", {loc: e.currentTarget.value, isChannel: false});
    }

    const askIfConnected = () => {
        if (friends.length) {
            let arrayToAskIfConnected: {userId: string}[] = [];
            friends.forEach((friend) => {
                arrayToAskIfConnected.push({userId: friend.friendId});
            })
            socket.emit("isConnected", arrayToAskIfConnected);
        }
        setAsk(true);
    }

    const fetchBlocked = () => {
        socket.emit("listBlock");
    }

    const invertDevelopBlock = () => {
        setDevelopBlock(!developBlock);
    }

    const unblockEvent = (e : any) => {
        socket.emit("unblockUser", {id: e.currentTarget.value})
    }

    useEffect(() => {
        fetchBlocked();
        socket.on("listBlock", (data: {id: string, name: string}[]) => {
            setBlocked(data);
            setBlockDone(true);
        })
    }, []);

    useEffect(() => {
        if (!fetchDone)
            fetchFriends();
        if (fetchDone && !askIfConnectedDone)
            askIfConnected();
    }, [fetchDone]);

    useEffect(() => {
        fetchPending();
        fetchRequests();
        fetchBlocked();
    }, []);

    useEffect(() => {
        socket.on("newFriend", (friendshipId: string, id: string, name: string) => {
            console.log("new friend: ", friendshipId, id, name);
            let newFriend: {key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean} =
                {
                    key: id,
                    friendshipId: friendshipId,
                    friendId: id,
                    friendName: name,
                    isConnected: false,
                }
            newFriend.key.concat('0');
            let newFriendList = [...friends, newFriend];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            setFriends(newFriendList);
            socket.emit("isConnected", [{userId: id}]);
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }));
            setRequests(requests.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }));
            setBugReactHook(!bugReactHook);
        });

        socket.on("supressFriend", (friendshipId: string) => {
            const newFriendList = friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            });
            if (newFriendList.length == 0)
                setDevelopFriend(false);
            setFriends(newFriendList);
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }));
            setRequests(requests.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }));
            setBugReactHook(!bugReactHook);
        });

        socket.on("usersAreConnected", (userIds: string[]) => {
            let newFriendList = friends;
            for (let eltData of userIds) {
                for (let elt of newFriendList) {
                    if (elt.friendId == eltData) {
                        elt.key = elt.key.slice(0, -1).concat('1');
                        elt.isConnected = true;
                        break;
                    }
                }
            }
            setFriends(newFriendList);
            setBugReactHook(!bugReactHook);
        });

        socket.on("userConnected", (user: {userId: string, userLogin: string}) => {
            let newFriendList = friends;
            for (let elt of newFriendList) {
                if (elt.friendId == user.userId) {
                    elt.key = elt.key.slice(0, -1).concat('1');
                    elt.isConnected = true;
                    break;
                }
            }
            setFriends(newFriendList);
            setBugReactHook(!bugReactHook);
        });

        socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
            console.log("disconnected: ", user.userLogin);
            let newFriendList = friends;
            for (let elt of newFriendList) {
                if (elt.friendId == user.userId) {
                    elt.key = elt.key.slice(0, -1).concat('0');
                    elt.isConnected = false;
                    break;
                }
            }
            setFriends(newFriendList);
            setBugReactHook(!bugReactHook);
        });

        socket.on("newFriendRequestSent", (friendshipId: string, friendId: string, friendName: string) => {
            let newPendings = [...pendings, {friendshipId: friendshipId, friendId: friendId, friendName: friendName}];
            newPendings.sort((a, b) => {
                return a.friendName.localeCompare(b.friendName);
            })
            setPendings(newPendings);
            setRequests(requests.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }));
            setBugReactHook(!bugReactHook);
        });

        socket.on("supressFriendRequest", (friendshipId: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
            setBugReactHook(!bugReactHook);
        });

        socket.on("newFriendRequestReceived", (friendshipId: string, id: string, name: string) => {
            let newRequests = [...requests, {friendshipId: friendshipId, friendId: id, friendName: name}];
            newRequests.sort((a, b) => {
                return a.friendName.localeCompare(b.friendName);
            })
            setRequests(newRequests);
            setBugReactHook(!bugReactHook);
        });

        socket.on("listBlock", (data: {id: string, name: string}[]) => {
            setBlocked(data);
            setBugReactHook(!bugReactHook);
            setBlockDone(true);
        })

        return () => {
            socket.off("newFriendRequestSent");
            socket.off("newFriend");
            socket.off("supressFriendRequest");
            socket.off("supressFriend");
            socket.off("newFriendRequestReceived");
            socket.off("userIsConnected");
            socket.off("userConnected");
            socket.off("usersAreConnected");
            socket.off("userDisconnected");
            socket.off("listBlock");
        }
    }, [friends, pendings, requests, bugReactHook])

    return (
        <div id="FriendManagement">
            {fetchDone && requestDone && blockDone && <SearchbarFriend friendList={friends} requestSend={pendings} blockList={blocked} />}
            {friends.length > 0 && <div>
                <div className="title">
                    <h3>My friend{friends.length > 1 && "s"}</h3>
                    <button className="developButton" onClick={invertDevelopFriend}>
                        {developFriend  ?   <FontAwesomeIcon icon={faCaretUp} />
                                        :   <FontAwesomeIcon icon={faCaretDown} />}
                </button>
                </div>
                {developFriend && <ul className="list">
                    {friends.map((elt) => (
                        <li className="element" key={elt.key}>
                            <div className="friend">
                                <div className={elt.isConnected ? "circle online" : "circle offline"}></div>
                                <NavLink to={`/profile/${elt.friendId}`}>
                                    <div className="name">{elt.friendName}</div>
                                </NavLink>
                                <button value={elt.friendId} id="chatButton" data-hover-text="chat with" onClick={changeLoc}>
                                    <NavLink id="chatButton" to={`/chat`}>
                                        <FontAwesomeIcon className="iconAction" icon={faCommentDots} />
                                    </NavLink>
                                </button>
                                <button value={elt.friendshipId} data-hover-text="unfriend" id="unfriendButton" onClick={unfriendHandler}>
                                    <FontAwesomeIcon className="iconAction" icon={faTrashCan} />
                                </button>
                            </div>
                            {elt.isConnected && <div id="invite">
                                <button value={elt.friendName} onClick={proposeGame} data-type="normal">normal</button>
                                <FontAwesomeIcon className="iconAction" icon={faGamepad} />
                                <button value={elt.friendName} onClick={proposeGame} data-type="super">super</button>
                            </div>}
                        </li>
                        ))}
                </ul>}
            </div>}
            {pendings.length > 0 && <div>
                <div className="title">
                    <h3>My pending request{pendings.length > 1 && "s"}</h3>
                    <button className="developButton" onClick={invertDevelopPending}>
                        {developPending ? <FontAwesomeIcon icon={faCaretUp} />
                                        : <FontAwesomeIcon icon={faCaretDown} />}
                    </button>
                </div>
                {developPending && <ul className="list">
                    {pendings.map((elt) => (
                        <li className="element" key={elt.friendId}>
                            <NavLink id="navlink" to={`/profile/${elt.friendId}`}>
                                <span className="name">{elt.friendName}</span>
                            </NavLink>
                            <button value={elt.friendshipId} onClick={cancelHandler} id="cancelRequestButton">
                                <FontAwesomeIcon className="iconAction" icon={faCancel} />
                            </button>
                        </li>
                    ))}
                </ul>}
            </div>}
            {requests.length > 0 && <div>
                <div className="title">
                    <h3>Request{requests.length > 1 && "s"} I received</h3>
                    <button className="developButton" onClick={invertDevelopRequest}>
                        {developRequest ? <FontAwesomeIcon icon={faCaretUp} />
                                        : <FontAwesomeIcon icon={faCaretDown} />}
                    </button>
                </div>
                {developRequest && <ul className="list">
                    {requests.map((elt) => (
                        <li className="element" key={elt.friendshipId}>
                            <NavLink id="navlink" to={`/profile/${elt.friendId}`}>
                                <span className="name">{elt.friendName}</span>
                            </NavLink>
                            <button value={elt.friendshipId} onClick={acceptHandler} id="acceptFriendButton">
                                <FontAwesomeIcon className="iconAction" icon={faThumbsUp} />
                            </button>
                            <button value={elt.friendshipId} onClick={declineHandler} id="declineFriendButton">
                                <FontAwesomeIcon className="iconAction" icon={faThumbsDown} />
                            </button>
                        </li>
                    ))}
                </ul>}
            </div>}
            {blocked.length > 0 && <div>
                <div className="title">
                    <h3>User{blocked.length > 1 && "s"} I blocked</h3>
                    <button className="developButton" onClick={invertDevelopBlock}>
                        {developBlock   ? <FontAwesomeIcon icon={faCaretUp} />
                                        : <FontAwesomeIcon icon={faCaretDown} />}
                    </button>
                </div>
                {developBlock && <ul className="list">
                    {blocked.map((elt, id) => (
                        <li className="element" key={id}>
                            <NavLink id="navlink" to={`/profile/${elt.id}`}>
                                <span className="name">{elt.name}</span>
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