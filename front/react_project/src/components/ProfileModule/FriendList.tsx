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
            }
            setFriend(friendsArray);
        });
    }

    const unfriendHandler = (e: any) => {
        socket.emit("unfriend", {userId: e.target.value});
    }

    const inviteToGameHandler = (e:any) => {
        console.log("invite To Game");
    }

    useEffect(() => {
        fetchFriends();
        socket.on("newFriend", (id: string, name: string) => {

        })
        socket.on("supressFriend", (id: string, name: string) => {
            setFriend(friends.filter(friend => {
                return friend.friendId != id;
            }))
        })
        return () => {
            socket.off("newFriend");
            socket.off("supressFriend");
        }
    }, []);

    return (
        <div className="friendList">
            {friends.length > 0 && <h3>My friend{friends.length > 1 && "s"}</h3>}
            <ul className="friendList">
                {friends.map((elt, id) => (
                    <li className="friendElement" key={id}>{elt.friendName}
                    <button value={elt.friendId} className="unfriendButton" onClick={unfriendHandler}>unfriend</button>
                    <NavLink to={`/chat/${elt.friendId}`}>Chatting</NavLink>
                    <button value={elt.friendId} className="inviteToGame" onClick={inviteToGameHandler}>invite to game</button>
                    <NavLink to={`/profile/${elt.friendId}`}>See profile</NavLink>
                    </li>
                    ))}
            </ul>
        </div>
    )
}