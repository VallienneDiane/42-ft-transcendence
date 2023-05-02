import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom"
import { User } from "../../models";
import "../../styles/Profile.scss"
import { userService } from "../../services/user.service";
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { SocketContext } from "../context";
import FriendList from "./FriendList";
import PendingList from "./PendingList";
import RequestsList from "./RequestList";
import BlockList from "./BlockList";
import MatchHistory from "./MatchHistory";

export default function Profile() {
    const {socket} = useContext(SocketContext);
    const {socketGame} = useContext(SocketContext);
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const currentUser = useParams().login;
    
    useEffect(() => {
        if (currentUser !== undefined){
            userService.getUserWithAvatar(currentUser)
            .then(response => {
                if (response.data === "") {
                    navigate('/profile');
                }
                setUser(response.data);
            })
            .catch(error => {
                console.log(error);
            });
        }
        else {
            let decodedToken: JwtPayload = accountService.readPayload()!;
            const id = decodedToken.sub;
            userService.getUserWithAvatar(id!)
            .then(response => {
                setUser(response.data);
            })
            .catch(error => {
                console.log(error);
            });
        }

        return () => {
            if (socket) {
                socket.off("newFriendRequestSent");
                socket.off("newFriend");
                socket.off("supressFriendRequest");
                socket.off("supressFriend");
                socket.off("newFriendRequestReceived");
                socket.off("userIsConnected");
                socket.off("userConnected");
                socket.off("userDisconnected");
                socketGame.off("matchHistory");
            }
        }
    }, [currentUser, navigate])
    
    return (
        
        <div id="profilePage">
            
            <aside>
                {/* { user?.avatarSvg} */}
                <img id="profilePicture" src={user?.avatarSvg!} />
                {/* Online or not */}
                <div id="login">
                    <h1>{user?.login}</h1>
                    { currentUser === undefined ? <NavLink to="/settings"><FontAwesomeIcon icon={faGear} /></NavLink> : null }
                </div>

                {currentUser === undefined ? (
                    <div id="FriendManagement">
                        {/* <SearchUserBar/> */}
                        {socket && <FriendList socket={socket} />}
                        {socket && <PendingList />}
                        {socket && <RequestsList />}
                        {socket && <BlockList />}
                    </div>
                    ): null}
            </aside>
            {socketGame && user != undefined && <MatchHistory userId={user.id!} />}
        </div>
    )
}