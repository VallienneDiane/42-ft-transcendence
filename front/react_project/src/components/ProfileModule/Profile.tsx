import React, { ContextType, useContext, useEffect, useState } from "react";
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
import Axios from "../../services/caller.service";

// class OtherProfile extends React.Component<{userId: string, userName: string}, {
//     me: JwtPayload, 
//     isBlock: boolean, 
//     isFriend: boolean
// }> {
//     constructor(props: {userId: string, userName: string}) {
//         super(props);
//         this.state = { me: accountService.readPayload()!,
//         isBlock: false, 
//         isFriend: false };
//         this.blockUser = this.blockUser.bind(this);
//         this.proposeGame = this.proposeGame.bind(this);
//     }
//     static contextType = SocketContext;
//     declare context: ContextType<typeof SocketContext>;

//     blockUser() {
//         this.context.socket.emit("blockUser", {id: this.props.userId});
//     }

//     proposeGame(event: React.MouseEvent<HTMLButtonElement>) {
//         if (event.currentTarget.getAttribute('data-type') === "normal")
//             this.context.socketGame.emit("Private_Matchmaking", {target: this.props.userName, super_game_mode: false});
//         else if (event.currentTarget.getAttribute('data-type') === "super")
//             this.context.socketGame.emit("Private_Matchmaking", {target: this.props.userName, super_game_mode: true});
//     }
    
//     render() {
//         if (this.context.socket) {
//             return (
//                 <div id="actionProfile">
//                     <ul className="buttonList">
//                     <li>
//                         Propose a game<br></br>
//                         <button onClick={this.proposeGame} data-type="normal">normal</button>
//                         <FontAwesomeIcon className="iconAction" icon={faGamepad} />
//                         <button onClick={this.proposeGame} data-type="super">super</button>
//                     </li>
//                     <li onClick={this.blockUser}>Block</li>
//                     </ul>
//                 </div>
//             )
//         }
//     }
// }

function OtherProfile(props: {userId: string, userName: string}) {
    const {socket} = useContext(SocketContext);
    const {socketGame} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [isBlock, setIsBlock] = useState<boolean>(false);
    const [isFriend, setIsFriend] = useState<boolean>(false);

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

    useEffect(() => {
        if (socket) {
            socket.emit("listBlock");
            socket.on("listBlock", (data: {id: string, name: string}[]) => {
                data.forEach((user) => {
                    if (user.id === props.userId)
                        setIsBlock(true);
                })
            })
            Axios.get("listFriends/" + me.sub)
            .then((friends) => {
                Axios.get("listRequestsPendingSend/" + me.sub)
                .then((pending) => {
                    for (let elt of friends.data) {
                        if (elt.friendId === props.userId)
                            setIsFriend(true);
                    }
                    for (let elt of pending.data) {
                        if (elt.friendId === props.userId)
                            setIsFriend(true);
                    }
                })
                .catch(error => { console.log(error); })
            })
            .catch(error => { console.log(error); })
    
            return () => {
                socket.off("listBlock");
            }
        }
    }, [socket])
    
    return (
        <div id="actionProfile">
            <ul className="buttonList">
                {!isFriend && <li onClick={addFriend}>Add Friend</li>}
                <li>Propose a game<br></br>
                    <button onClick={proposeGame} data-type="normal">normal</button>
                    <FontAwesomeIcon className="iconAction" icon={faGamepad} />
                    <button onClick={proposeGame} data-type="super">super</button>
                </li>
                {!isBlock && <li onClick={blockUser}>Block</li>}
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
        if (currentUser !== undefined) {
            if (currentUser.length > 15) {
                userService.getUserWithAvatar(currentUser)
                .then(response => {
                    if (response.data === "") {
                        navigate('/profile');
                    }
                    setUser(response.data);
                })
                .catch(error => {
                    navigate('/profile');
                });
            }
            else {
                userService.getUserWithAvatarUsingLogin(currentUser)
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
                ) : null}
                {socket && currentUser !== undefined && <OtherProfile userId={user?.id!} userName={user?.login!} />}
            </aside>
            {socketGame && user != undefined && <MatchHistory userId={user.id!} />}
        </div>
    )
}