import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"
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

export default function Profile() {
    const {socket} = useContext(SocketContext);
    const navigate = useNavigate();
    const [user, setUser] = useState<User>();
    const currentUser = useParams().login;

    useEffect(() => {
        if (currentUser !== undefined){
            userService.getUser(currentUser)
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
            userService.getUser(decodedToken.login)
            .then(response => {
                setUser(response.data);
            })
            .catch(error => {
                console.log(error);
            });
        }
    }, [currentUser])
    
    useEffect(() => {
        console.log('user', user);
    }, [user])
    
    return (
        
        <div id="profilePage">
            
            <aside>
                {/* { user?.avatarSvg} */}
                <img id="profilePicture" src={user?.avatarSvg!} />
                {/* Online or not */}
                <div id="login">
                    <h1>{user?.login}</h1>
                    { currentUser === undefined ? <a href="/settings"><FontAwesomeIcon icon={faGear} /></a> : null }
                </div>

                {currentUser === undefined ? (
                    <div id="FriendManagement">
                        {/* <SearchUserBar/> */}
                        <FriendList />
                        <PendingList />
                        <RequestsList />
                        {socket && <BlockList />}
                    </div>
                    ): null}
            </aside>
            <div id="score">
                <div id="stats">
                    <h2>Statistics</h2>

                </div>
                <div id="history">
                    <h2>Match History</h2>

                </div>
            </div>

        </div>
    )
}