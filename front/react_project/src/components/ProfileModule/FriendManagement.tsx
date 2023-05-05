import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faArrowDown, faArrowUp, faCancel, faCommentDots, faPeace, faPingPongPaddleBall, faThumbsDown, faThumbsUp, faTrashCan } from "@fortawesome/free-solid-svg-icons";


export default function FriendManagement() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [friends, setFriends] = useState<{key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[]>([]);
    const [developFriend, setDevelopFriend] = useState<boolean>(false);
    const [askIfConnectedDone, setAsk] = useState<boolean>(false);
    const [fetchDone, setFetch] = useState<boolean>(false);
    const [pendings, setPendings] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);
    const [developPending, setDevelopPending] = useState<boolean>(false);
    const [requests, setRequests] = useState<{friendshipId: string, friendId: string, friendName: string}[]>([]);
    const [developRequest, setDevelopRequest] = useState<boolean>(false);
    const [blocked, setBlocked] = useState<{id: string, name: string}[]>([]);
    const [developBlock, setDevelopBlock] = useState<boolean>(false);

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

    const inviteToGameHandler = (e: any) => {
        console.log("invite To Game");
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
        });

        socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
            let newFriendList = friends;
            for (let elt of newFriendList) {
                if (elt.friendId == user.userId) {
                    elt.key = elt.key.slice(0, -1).concat('0');
                    elt.isConnected = false;
                    break;
                }
            }
            setFriends(newFriendList);
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
        });

        socket.on("supressFriendRequest", (friendshipId: string) => {
            setPendings(pendings.filter((elt) => {
                return elt.friendshipId != friendshipId;
            }))
        });

        socket.on("newFriendRequestReceived", (friendshipId: string, id: string, name: string) => {
            let newRequests = [...requests, {friendshipId: friendshipId, friendId: id, friendName: name}];
            newRequests.sort((a, b) => {
                return a.friendName.localeCompare(b.friendName);
            })
            setRequests(newRequests);
        });

        socket.on("listBlock", (data: {id: string, name: string}[]) => {
            setBlocked(data);
        })

        return () => {
            socket.off("newFriendRequestSent");
            socket.off("newFriend");
            socket.off("supressFriendRequest");
            socket.off("supressFriend");
            socket.off("newFriendRequestReceived");
            socket.off("userIsConnected");
            socket.off("userConnected");
            socket.off("userDisconnected");
            socket.off("listBlock");
        }
    }, [friends, pendings, requests])

    return (
        <div id="FriendManagement">
            {friends.length > 0 && <div id="friend">
                <div id="titleFriend">
                    <h3>My friend{friends.length > 1 && "s"}</h3>
                    <button id="developButton" onClick={invertDevelopFriend}>
                        {developFriend  ?   <FontAwesomeIcon icon={faArrowUp} />
                                        :   <FontAwesomeIcon icon={faArrowDown} />}
                </button>
                </div>
                {developFriend && <ul id="friendList">
                    {friends.map((elt) => (
                        <li id="friendElement" key={elt.key}>
                            <span id="friendInfo">
                                <div className="name">{elt.friendName}</div>
                                <div className={elt.isConnected ? "circle online" : "circle offline"}></div>
                            </span>
                        <span id="friendOptions">
                            <NavLink id="checkProfileButton" data-hover-text="check profile" to={`/profile/${elt.friendId}`}>
                                <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
                            </NavLink>
                            <button value={elt.friendId} id="chatButton" data-hover-text="chat with" onClick={changeLoc}>
                                <NavLink id="chatButton" to={`/chat`}>
                                    <FontAwesomeIcon className="iconAction" icon={faCommentDots} />
                                </NavLink>
                            </button>
                            {elt.isConnected && <button value={elt.friendId} data-hover-text="invite to play" id="inviteToGame" onClick={inviteToGameHandler}>
                                <FontAwesomeIcon className="iconAction" icon={faPingPongPaddleBall} />
                            </button>}
                            <button value={elt.friendshipId} data-hover-text="unfriend" id="unfriendButton" onClick={unfriendHandler}>
                                <FontAwesomeIcon className="iconAction" icon={faTrashCan} />
                            </button>
                        </span>
                        </li>
                        ))}
                </ul>}
            </div>}
            {pendings.length > 0 && <div id="pending">
                <div id="titlePending">
                    <h3>
                        My pending request{pendings.length > 1 && "s"}
                    </h3>
                    <button id="developButton" onClick={invertDevelopPending}>
                        {developPending ? <FontAwesomeIcon icon={faArrowUp} />
                                        : <FontAwesomeIcon icon={faArrowDown} />}
                    </button>
                </div>
                {developPending && <ul id="pendingList">
                    {pendings.map((elt) => (
                        <li id="pendingElement" key={elt.friendId}>
                            <span className="name">{elt.friendName}</span>
                            <NavLink id="checkProfileButton" to={`/profile/${elt.friendId}`}>
                                <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
                            </NavLink>
                            <button value={elt.friendshipId} onClick={cancelHandler} id="cancelRequestButton">
                                <FontAwesomeIcon className="iconAction" icon={faCancel} />
                            </button>
                        </li>
                    ))}
                </ul>}
            </div>}
            {requests.length > 0 && <div id="request">
                <div id="titleRequest">
                    <h3>Request{requests.length > 1 && "s"} I received</h3>
                    <button id="developButton" onClick={invertDevelopRequest}>
                        {developRequest ? <FontAwesomeIcon icon={faArrowUp} />
                                        : <FontAwesomeIcon icon={faArrowDown} />}
                    </button>
                </div>
                {developRequest && <ul id = "requestList">
                    {requests.map((elt) => (
                        <li id="requestElement" key={elt.friendshipId}><span className="name">{elt.friendName}</span>
                            <NavLink id="checkProfileButton" to={`/profile/${elt.friendId}`}>
                                <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
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
            {blocked.length > 0 && <div id="block">
                <div id="titleBlock">
                    <h3>
                        User{blocked.length > 1 && "s"} I blocked
                    </h3>
                    <button id="developButton" onClick={invertDevelopBlock}>
                        {developBlock   ? <FontAwesomeIcon icon={faArrowUp} />
                                        : <FontAwesomeIcon icon={faArrowDown} />}
                    </button>
                </div>
                {developBlock && <ul id="blockList">
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