import { useContext, useEffect, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom"
import { User } from "../../models";
import "../../styles/Profile.scss"
import { userService } from "../../services/user.service";
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGamepad, faGear } from '@fortawesome/free-solid-svg-icons';
import { SocketContext } from "../context";
import MatchHistory from "./MatchHistory";
import FriendManagement from "./FriendManagement";

function OtherProfile(props: {userId: string, userName: string}) {
    const {socket} = useContext(SocketContext);
    const {socketGame} = useContext(SocketContext);

    const addFriend = () => {
        socket.emit("friendRequest", {userId: props.userId});
    }

    const blockUser = () => {
        socket.emit("blockUser", {id: props.userId});
    }

    const proposeGame = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.currentTarget.getAttribute('data-type') === "normal")
            socketGame.emit("Private_Matchmaking", {target: props.userName, super_game_mode: false});
        else if (event.currentTarget.getAttribute('data-type') === "normal")
            socketGame.emit("Private_Matchmaking", {target: props.userName, super_game_mode: true});
    }
    
    return (
        <div id="actionProfile">
            <ul className="buttonList">
                <li onClick={addFriend}>Add Friend</li>
                <li>Propose a game<br></br>
                    <button onClick={proposeGame} data-type="normal">normal</button>
                    <FontAwesomeIcon className="iconAction" icon={faGamepad} />
                    <button onClick={proposeGame} data-type="super">super</button>
                </li>
                <li onClick={blockUser}>Block</li>
            </ul>
        </div>
    )
}

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
                { currentUser === undefined ? <NavLink to="/settings"><FontAwesomeIcon className="gear" icon={faGear} /></NavLink> : null }
                <img id="profilePicture" src={user?.avatarSvg!} />
                <div id="login">
                    <h1>{user?.login}</h1>
                </div>
                {currentUser === undefined ? (
                <div id="FriendManagement">
                    {socket && <FriendManagement />}
                </div>
                ) : <OtherProfile userId={user?.id!} userName={user?.login!} />}
            </aside>
            {socketGame && user != undefined && <MatchHistory userId={user.id!} />}
        </div>
    )
}