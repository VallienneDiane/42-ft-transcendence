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
    const [fetchUserDone, setFetchUserDone] = useState<boolean>(false);
    const [askIfConnectedDone, setAskIfConnected] = useState<boolean>(false);

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
                }
            setFriend(friendsArray);
            if (!fetchUserDone)
                setFetchUserDone(true);
        });
    }

    const unfriendHandler = (e: any) => {
        socket.emit("unfriend", {friendshipId: e.currentTarget.value});
    }

    const inviteToGameHandler = (e:any) => {
        console.log("invite To Game");
    }

    const askIfConnected = () => {
        if (friends.length) {
            let arrayToAskIfConnected: {userId: string}[] = [];
            friends.forEach((friend) => {
                arrayToAskIfConnected.push({userId: friend.friendId});
            })
            socket.emit("isConnected", arrayToAskIfConnected);
        }
        setAskIfConnected(true);
    }

    useEffect(() => {
        if (!fetchUserDone)
            fetchFriends();
    }, [])

    useEffect(() => {
        if (fetchUserDone && !askIfConnectedDone)
            askIfConnected();
        console.log("pouet");
        socket.on("newFriend", (friendshipId: string, id: string, name: string) => {
            console.log("newFriend");
            let newFriendList = [...friends, {friendshipId: friendshipId, friendId: id, friendName: name, isConnected: false}];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            setFriend(newFriendList);
            socket.emit("isConnected", {userId: id});
        });
        
        socket.on("supressFriend", (friendshipId: string) => {
            console.log("unfriend", friendshipId);
            setFriend(friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            }))
        });

        socket.on("usersAreConnected", (userIds: string[]) => {
            let newFriendList = friends;
            for (let eltData of userIds) {
                for (let elt of newFriendList) {
                    if (elt.friendId == eltData) {
                        elt.isConnected = true;
                        break;
                    }
                }
            }
            console.log("newFriends", newFriendList, "userIds", userIds);
            setFriend(newFriendList);
            setBug(!bug);
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
            console.log("pas pouet");
            socket.off("newFriend");
            socket.off("supressFriend");
            socket.off("userIsConnected");
            socket.off("userConnected");
            socket.off("userDisconnected");
        }
    }, [friends, fetchUserDone, bug]);

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