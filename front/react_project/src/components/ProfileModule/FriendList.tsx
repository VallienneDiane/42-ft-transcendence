import React, { useContext, useEffect, useState } from "react";
import Axios from "../../services/caller.service";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { NavLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressCard, faCheck, faComment, faCommentDots, faCommentSms, faGun, faHandsBubbles, faPoo, faSpaghettiMonsterFlying, faTrashCan, faWalkieTalkie } from "@fortawesome/free-solid-svg-icons";
import { Socket } from "socket.io-client";

class FriendList extends React.Component<{socket: Socket}, {
    me: JwtPayload,
    friends: {friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[],
    fetchFriendsDone: boolean,
    askIfConnectedDone: boolean,
}> {
    constructor(props:{socket: Socket}) {
        super(props);
        this.state = {
            me: accountService.readPayload()!,
            friends: [],
            fetchFriendsDone: false,
            askIfConnectedDone: false,
        }
        this.fetchFriends = this.fetchFriends.bind(this);
        this.unfriendHandler = this.unfriendHandler.bind(this);
        this.inviteToGameHandler = this.inviteToGameHandler.bind(this);
        this.askIfConnected = this.askIfConnected.bind(this);
    }

    fetchFriends() {
        Axios.get("listFriends/" + this.state.me.sub)
        .then((response) => {
            let friendsArray: {friendshipId: string, friendId: string, friendName: string, isConnected: boolean}[] = [];
            for (let elt of response.data) {
                friendsArray.push({
                    friendshipId: elt.friendshipId,
                    friendId: elt.friendId,
                    friendName: elt.friendName,
                    isConnected: false});
                }
            this.setState({
                friends: friendsArray,
                fetchFriendsDone: true});
        });
    }

    unfriendHandler(e: any) {
        this.props.socket.emit("unfriend", {friendshipId: e.currentTarget.value});
    }

    inviteToGameHandler(e:any) {
        console.log("invite To Game");
    }

    askIfConnected() {
        if (this.state.friends.length) {
            let arrayToAskIfConnected: {userId: string}[] = [];
            this.state.friends.forEach((friend) => {
                arrayToAskIfConnected.push({userId: friend.friendId});
            })
            this.props.socket.emit("isConnected", arrayToAskIfConnected);
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
        this.props.socket.on("newFriend", (friendshipId: string, id: string, name: string) => {
            console.log("newFriend");
            let newFriendList = [...this.state.friends, {friendshipId: friendshipId, friendId: id, friendName: name, isConnected: false}];
            newFriendList.sort((a, b) => {
                return (a.friendName.localeCompare(b.friendName));
            });
            this.setState({friends: newFriendList});
            this.props.socket.emit("isConnected", [{userId: id}]);
        });

        this.props.socket.on("supressFriend", (friendshipId: string) => {
            console.log("unfriend", friendshipId);
            this.setState({friends: this.state.friends.filter(friend => {
                return friend.friendshipId != friendshipId;
            })})
        });

        this.props.socket.on("tamere", () => {
            console.log("tamere");
        })

        this.props.socket.on("usersAreConnected", (userIds: string[]) => {
            let newFriendList = this.state.friends;
            for (let eltData of userIds) {
                for (let elt of newFriendList) {
                    if (elt.friendId == eltData) {
                        elt.isConnected = true;
                        break;
                    }
                }
            }
            this.setState({friends: newFriendList});
        });

        this.props.socket.on("userConnected", (userId: string, userName: string) => {
            let newFriendList = this.state.friends;
            for (let elt of newFriendList) {
                if (elt.friendId == userId) {
                    elt.isConnected = true;
                    this.setState({friends: newFriendList});
                    break;
                }
            }
        });

        this.props.socket.on("userDisconnected", (userId: string, userName: string) => {
            let newFriendList = this.state.friends;
            for (let elt of newFriendList) {
                if (elt.friendId == userId) {
                    elt.isConnected = false;
                    this.setState({friends: newFriendList});
                    break;
                }
            }
        });
    }

    componentWillUnmount(): void {
        this.props.socket.off("newFriend");
        this.props.socket.off("supressFriend");
        this.props.socket.off("userIsConnected");
        this.props.socket.off("userConnected");
        this.props.socket.off("userDisconnected");
    }
    render() {
        return (
        <div id="friend">
            {this.state.friends.length > 0 && <h3 id="titleFriend">My friend{this.state.friends.length > 1 && "s"}</h3>}
            <ul id="friendList">
                {this.state.friends.map((elt) => (
                    <li id="friendElement" key={elt.friendId}>
                        <span id="friendInfo">
                            <div id="friendName">{elt.friendName}</div>
                            <div className={elt.isConnected ? "circle online" : "circle offline"}></div>
                        </span>
                    <span id="friendOptions">
                        <button value={elt.friendshipId} id="unfriendButton" onClick={this.unfriendHandler}>
                        <FontAwesomeIcon className="iconAction" icon={faTrashCan} />
                        </button>
                        <NavLink id="chatButton" to={`/chat/${elt.friendId}`}>
                        <FontAwesomeIcon className="iconAction" icon={faCommentDots} />
                        </NavLink>
                        <button value={elt.friendId} id="inviteToGame" onClick={this.inviteToGameHandler}>
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
}

export default FriendList;