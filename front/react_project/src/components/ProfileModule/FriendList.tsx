import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { NavLink } from "react-router-dom";

export default function FriendList() {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [friends, setFriend] = useState<{friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[]>([]);

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
                    socket.emit("isConnected", elt.friendId);
            }
            setFriend(friendsArray);
        });
    }

    const unfriendHandler = (e: any) => {
        socket.emit("unfriend", {friendshipId: e.target.value});
    }

    const inviteToGameHandler = (e:any) => {
        console.log("invite To Game");
    }

    useEffect(() => {
        fetchFriends();
        socket.on("newFriend", (friendshipId: string, id: string, name: string) => {
            let newFriendList = [...friends, {friendshipId: friendshipId, friendId: id, friendName: name, isConnected: false}];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            setFriend(newFriendList);
        });
        socket.on("supressFriend", (friendshipId: string) => {
            setFriend(friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            }))
        });
        socket.on("userIsConnected", (userId: string) => {
            let newFriendList = friends;
            let found = newFriendList.find((friend) => {
                return friend.friendId == userId;
            });
            if (found != undefined) {
                found.isConnected = true;
                setFriend(newFriendList);
            }
        });
        socket.on("userConnected", (userId: string, userName: string) => {
            let newFriendList = friends;
            let found = newFriendList.find((friend) => {
                return friend.friendId == userId;
            });
            if (found != undefined) {
                found.isConnected = true;
                setFriend(newFriendList);
            }
        });
        socket.on("userDisconnected", (userId: string, userName: string) => {
            let newFriendList = friends;
            let found = newFriendList.find((friend) => {
                return friend.friendId == userId;
            });
            if (found != undefined) {
                found.isConnected = false;
                setFriend(newFriendList);
            }
        });
        return () => {
            socket.off("newFriend");
            socket.off("supressFriend");
            socket.off("userIsConnected");
            socket.off("userConnected");
            socket.off("userDisconnected");
        }
    }, []);

    return (
        <div className="friendList">
            {friends.length > 0 && <h3>My friend{friends.length > 1 && "s"}</h3>}
            <ul className="friendList">
                {friends.map((elt, id) => (
                    <li className="friendElement" key={id}>{elt.friendName}
                    <button value={elt.friendshipId} className="unfriendButton" onClick={unfriendHandler}>unfriend</button>
                    <NavLink to={`/chat/${elt.friendId}`}>Chatting</NavLink>
                    <button value={elt.friendId} className="inviteToGame" onClick={inviteToGameHandler}>invite to game</button>
                    <NavLink to={`/profile/${elt.friendName}`}>See profile</NavLink>
                    <div className={elt.isConnected? "circle online" : "circle offline"}></div>
                    </li>
                    ))}
            </ul>
        </div>
    )
}