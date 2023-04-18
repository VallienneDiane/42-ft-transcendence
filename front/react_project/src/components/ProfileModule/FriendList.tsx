import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faCheck, faComment, faCommentDots, faCommentSms, faGun, faHandsBubbles, faPoo, faSpaghettiMonsterFlying, faTrashCan, faWalkieTalkie } from "@fortawesome/free-solid-svg-icons";

export default function FriendList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [friends, setFriend] = useState<{friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[]>([]);
    const [bug, setBug] = useState<boolean>(false); //react hooks is unable to detect when I update a boolean of an array.

    const fetchFriends = () => {
        Axios.get("listFriends/" + me.sub)
        .then((response) => {
            let friendsArray: {friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[] = [];
            for (let elt of response.data) {
                friendsArray.push({
                    friendshipId: elt.friendshipId,
                    friendId: elt.friendId,
                    friendName: elt.friendName,
                    isConnected: false});
                    socket.emit("isConnected", {userId: elt.friendId});
            }
            setFriend(friendsArray);
        });
    }

    const unfriendHandler = (e: any) => {
        socket.emit("unfriend", {friendshipId: e.currentTarget.value});
    }

    const inviteToGameHandler = (e:any) => {
        console.log("invite To Game");
    }

    useEffect(() => {
        fetchFriends();
    }, [])

    useEffect(() => {
        socket.on("newFriend", (friendshipId: string, id: string, name: string) => {
            let newFriendList = [...friends, {friendshipId: friendshipId, friendId: id, friendName: name, isConnected: false}];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            setFriend(newFriendList);
            socket.emit("isConnected", {userId: id});
        });
        socket.on("supressFriend", (friendshipId: string) => {
            setFriend(friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            }))
        });
        socket.on("userIsConnected", (userId: string) => {
            let newFriendList = friends;
            for (let elt of newFriendList) {
                if (elt.friendId == userId) {
                    elt.isConnected = true;
                    setFriend(newFriendList);
                    setBug(!bug);
                    break;
                }
            }
        });
        socket.on("userConnected", (userId: string, userName: string) => {
            let newFriendList = friends;
            for (let elt of newFriendList) {
                if (elt.friendId == userId) {
                    elt.isConnected = true;
                    setBug(!bug);
                    setFriend(newFriendList);
                    break;
                }
            }
        });
        socket.on("userDisconnected", (userId: string, userName: string) => {
            let newFriendList = friends;
            for (let elt of newFriendList) {
                if (elt.friendId == userId) {
                    elt.isConnected = false;
                    setBug(!bug);
                    setFriend(newFriendList);
                    break;
                }
            }
        });
        return () => {
            socket.off("newFriend");
            socket.off("supressFriend");
            socket.off("userIsConnected");
            socket.off("userConnected");
            socket.off("userDisconnected");
        }
    }, [friends, bug]);

    return (
        <div id="friend">
            {friends.length > 0 && <h3 id="titleFriend">My friend{friends.length > 1 && "s"}</h3>}
            <ul id="friendList">
                {friends.map((elt) => (
                    <li id="friendElement" key={elt.friendId}>
                        <span id="friendInfo">
                            <div id="friendName">{elt.friendName}</div>
                            <div className={elt.isConnected ? "circle online" : "circle offline"}></div>
                        </span>
                    <span id="friendOptions">
                        <button value={elt.friendshipId} id="unfriendButton" onClick={unfriendHandler}>
                        <FontAwesomeIcon className="iconAction" icon={faTrashCan} />
                        </button>
                        <NavLink id="chatButton" to={`/chat/${elt.friendId}`}>
                        <FontAwesomeIcon className="iconAction" icon={faCommentDots} />
                        </NavLink>
                        <button value={elt.friendId} id="inviteToGame" onClick={inviteToGameHandler}>
                        <FontAwesomeIcon className="iconAction" icon={faGun} />
                        </button>
                        <NavLink id="checkProfileButton" to={`/profile/${elt.friendName}`}>
                        <FontAwesomeIcon className="iconAction" icon={faAddressCard} />
                        </NavLink>
                    </span>
                    </li>
                    ))}
            </ul>
        </div>
    )
}