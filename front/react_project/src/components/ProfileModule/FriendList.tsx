import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faArrowDown, faArrowUp, faCommentDots, faPingPongPaddleBall, faTrashCan } from "@fortawesome/free-solid-svg-icons";


export default function FriendList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [friends, setFriends] = useState<{key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[]>([]);
    const [develop, setDevelop] = useState<boolean>(false);
    const [askIfConnectedDone, setAsk] = useState<boolean>(false);
    const [fetchDone, setFetch] = useState<boolean>(false);
    const [hookBug, setHookBug] = useState<boolean>(false);

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

    const unfriendHandler = (e: any) => {
        socket.emit("unfriend", {friendshipId: e.currentTarget.value});
    }

    const inviteToGameHandler = (e: any) => {
        console.log("invite To Game");
    }

    const invertDevelop = () => {
        setDevelop(!develop);
        if (!develop)
            askIfConnected();
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

    useEffect(() => {
        console.log("loop");
        if (!fetchDone)
            fetchFriends();
        if (fetchDone && !askIfConnectedDone)
            askIfConnected();
    }, [fetchDone]);

    useEffect(() => {
        console.log("launch");
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
            console.log("newFriend", newFriend);
            let newFriendList = [...friends, newFriend];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            setFriends(newFriendList);
            socket.emit("isConnected", [{userId: id}]);
        });

        socket.on("supressFriend", (friendshipId: string) => {
            const newFriendList = friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            });
            setFriends(newFriendList);
            if (!newFriendList.length)
                setDevelop(false);
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
            setHookBug(!hookBug);
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
            setHookBug(!hookBug);
        });
    }, [friends, hookBug])

    return (
        friends.length > 0 && <div id="friend">
            <div id="titleFriend">
                <h3>My friend{friends.length > 1 && "s"}</h3>
                <button id="developButton" onClick={invertDevelop}>
                    {develop ? <FontAwesomeIcon icon={faArrowUp} />
                                        : <FontAwesomeIcon icon={faArrowDown} />}
                </button>
            </div>
            {develop && <ul id="friendList">
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
        </div>
    )
}
/* Class Version, bugged
class FriendList extends React.Component<{}, {
    me: JwtPayload,
    friends: {key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[],
    fetchFriendsDone: boolean,
    askIfConnectedDone: boolean,
    develop: boolean,
}> {
    constructor(props:{}) {
        super(props);
        this.state = {
            me: accountService.readPayload()!,
            friends: [],
            fetchFriendsDone: false,
            askIfConnectedDone: false,
            develop: false,
        }
        this.fetchFriends = this.fetchFriends.bind(this);
        this.unfriendHandler = this.unfriendHandler.bind(this);
        this.inviteToGameHandler = this.inviteToGameHandler.bind(this);
        this.askIfConnected = this.askIfConnected.bind(this);
        this.changeLoc = this.changeLoc.bind(this);
        this.invertDevelop = this.invertDevelop.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;

    fetchFriends() {
        Axios.get("listFriends/" + this.state.me.sub)
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
            this.setState({
                friends: friendsArray,
                fetchFriendsDone: true});
        });
    }

    unfriendHandler(e: any) {
        this.context.socket.emit("unfriend", {friendshipId: e.currentTarget.value});
    }

    inviteToGameHandler(e:any) {
        console.log("invite To Game");
    }

    invertDevelop() {
        this.setState({develop: !this.state.develop});
        if (!this.state.develop)
            this.askIfConnected();
    }

    changeLoc(e: any) {
        this.context.socket.emit("changeLoc", {loc: e.currentTarget.value, isChannel: false});
    }

    askIfConnected() {
        if (this.state.friends.length) {
            let arrayToAskIfConnected: {userId: string}[] = [];
            this.state.friends.forEach((friend) => {
                arrayToAskIfConnected.push({userId: friend.friendId});
            })
            this.context.socket.emit("isConnected", arrayToAskIfConnected);
        }
        this.setState({askIfConnectedDone: true})
    }

    componentDidUpdate(): void {
        if (!this.state.fetchFriendsDone)
            this.fetchFriends();
        if (this.state.fetchFriendsDone && !this.state.askIfConnectedDone)
            this.askIfConnected();
    }

    componentDidMount(): void {
        console.log("launch");
        this.context.socket.on("newFriend", (friendshipId: string, id: string, name: string) => {
            let newFriend: {key: string, friendshipId: string, friendId: string, friendName: string, isConnected: boolean} =
                {
                    key: id,
                    friendshipId: friendshipId,
                    friendId: id,
                    friendName: name,
                    isConnected: false,
                }
            newFriend.key.concat('0');
            console.log("newFriend", newFriend);
            let newFriendList = [...this.state.friends, newFriend];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            this.setState({friends: newFriendList});
            this.context.socket.emit("isConnected", [{userId: id}]);
        });

        this.context.socket.on("supressFriend", (friendshipId: string) => {
            console.log("pouet");
            this.setState({friends: this.state.friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            })})
        });

        this.context.socket.on("usersAreConnected", (userIds: string[]) => {
            let newFriendList = this.state.friends;
            for (let eltData of userIds) {
                for (let elt of newFriendList) {
                    if (elt.friendId == eltData) {
                        elt.key = elt.key.slice(0, -1).concat('1');
                        elt.isConnected = true;
                        break;
                    }
                }
            }
            this.setState({friends: newFriendList});
        });

        this.context.socket.on("userConnected", (user: {userId: string, userLogin: string}) => {
            let newFriendList = this.state.friends;
            for (let elt of newFriendList) {
                if (elt.friendId == user.userId) {
                    elt.key = elt.key.slice(0, -1).concat('1');
                    elt.isConnected = true;
                    break;
                }
            }
            this.setState({friends: newFriendList});
        });

        this.context.socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
            let newFriendList = this.state.friends;
            for (let elt of newFriendList) {
                if (elt.friendId == user.userId) {
                    elt.key = elt.key.slice(0, -1).concat('0');
                    elt.isConnected = false;
                    break;
                }
            }
            this.setState({friends: newFriendList});
        });
    }

    render() {
        return (
        this.state.friends.length > 0 && <div id="friend">
            <div id="titleFriend">
                <h3>My friend{this.state.friends.length > 1 && "s"}</h3>
                <button id="developButton" onClick={this.invertDevelop}>
                    {this.state.develop ? <FontAwesomeIcon icon={faArrowUp} />
                                        : <FontAwesomeIcon icon={faArrowDown} />}
                </button>
            </div>
            {this.state.develop && <ul id="friendList">
                {this.state.friends.map((elt) => (
                    <li id="friendElement" key={elt.key}>
                        <span id="friendInfo">
                            <div className="name">{elt.friendName}</div>
                            <div className={elt.isConnected ? "circle online" : "circle offline"}></div>
                        </span>
                    <span id="friendOptions">
                        <NavLink id="checkProfileButton" data-hover-text="check profile" to={`/profile/${elt.friendId}`}>
                            <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
                        </NavLink>
                        <button value={elt.friendId} id="chatButton" data-hover-text="chat with" onClick={this.changeLoc}>
                            <NavLink id="chatButton" to={`/chat`}>
                                <FontAwesomeIcon className="iconAction" icon={faCommentDots} />
                            </NavLink>
                        </button>
                        {elt.isConnected && <button value={elt.friendId} data-hover-text="invite to play" id="inviteToGame" onClick={this.inviteToGameHandler}>
                            <FontAwesomeIcon className="iconAction" icon={faPingPongPaddleBall} />
                        </button>}
                        <button value={elt.friendshipId} data-hover-text="unfriend" id="unfriendButton" onClick={this.unfriendHandler}>
                            <FontAwesomeIcon className="iconAction" icon={faTrashCan} />
                        </button>
                    </span>
                    </li>
                    ))}
            </ul>}
        </div>
    )}
}

export default FriendList;*/