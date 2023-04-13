import { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";

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

    useEffect(() => {
        console.log(me.sub);
        fetchFriends();
    }, []);

    return (
        <div>
            {friends.length > 0 && <h3>My friend{friends.length > 1 && "s"}</h3>}
            <ul className="friendList">
                {friends.map((elt, id) => (
                    <li className="friendElement" key={id}>{elt.friendName}</li>
                    ))}
            </ul>
        </div>
    )
}