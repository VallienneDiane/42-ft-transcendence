import React, { useState, useContext, useEffect, useRef, ContextType } from "react";
import { SocketContext } from "../context";
import { useForm } from 'react-hook-form';
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { IDest, IChannel, ISearch } from "./Chat_models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faBroom, faCommentSlash, faEllipsisVertical, faFeather, faKiwiBird, faMagnifyingGlass, faRightFromBracket, faUser, faUserGroup, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";
import { userService } from "../../services/user.service";

function ModifyChannel(props: {channel: IChannel}) {
    const {socket} = useContext(SocketContext);
    const { register, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
        id: props.channel.id,
        name: props.channel.name,
        password: props.channel.password,
        channelPass: "",
        inviteOnly: props.channel.inviteOnly } 
    });
    const [showChannelPass, setShowChannelPass] = useState<boolean>(false);

    const changeState = (event: any) => {
        setShowChannelPass(event.target.checked);
    }

    const onSubmit = (data: IChannel) => {
        socket.emit('modifyChannel', {
            id: props.channel.id,
            name: data.name,
            password: data.password,
            channelPass: data.channelPass,
            inviteOnly: data.inviteOnly
        });
    };

    return (
        <form className="settingList" onSubmit={handleSubmit(onSubmit)}>
            <li>Name 
                <input className="inputChannel" {...register("name", { required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i })}
                    type="text"
                    placeholder=""
                />
                {errors.name && <div className="logError">Channel name is required</div>}
            </li>
            <li>Password
                <input type="checkbox" {...register("password")} onChange={changeState}/>
            </li>
            {showChannelPass && (
                <li>
                    <input className="inputPassword" {...register("channelPass", { required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i })}
                        type="password"
                        placeholder=""
                    /> 
                </li>)}
            {showChannelPass && errors.channelPass && <div className="logError">Your password is not valid</div>}
            <li>Invite Only<input type="checkbox" {...register("inviteOnly")}/></li>
            <li><button type="submit">Save</button></li>
        </form>
    )
}

function MuteFor(props: {user: string, dest: IDest, handleClose: () => void}) {
    const {socket} = useContext(SocketContext);
    const [minutes, setMinutes] = useState<number>(0);
    const [hours, setHours] = useState<number>(0);
    const [mouseOn, setMouseOn] = useState<boolean>(false);
    const [time, setTime] = useState<string>("");
    const [plus, setPlus] = useState<boolean>(false);

    const increment = (timi: string) => {
        if (timi == "minute") {
            if (minutes < 59)
                setMinutes(minutes => minutes + 1);
        }
        else {
            if (hours < 23)
                setHours(hours => hours + 1);
        }
    }

    const decrement = (timi: string) => {
        if (timi == "minute") {
            if (minutes > 0)
                setMinutes(minutes => minutes - 1);
        }
        else {
            if (hours > 0)
                setHours(hours => hours - 1);
        }
    }

    const handleMouse = (e: any) => {
        const tmp: string = e.target.value;
        const values: string[] = tmp.split(", ");
        if (e.type === "mousedown") {
            setMouseOn(true);
            if (values[0] == "minute")
                setTime("minute");
            if (values[0] == "hour")
                setTime("hours");
            if (values[1] == "-")
                setPlus(false);
            if (values[1] == "+")
                setPlus(true);
        } 
        else if (e.type === "mouseup") {
            setMouseOn(false);
            setTime("");
        }
    }

    const handleClick = (e: any) => {
        const tmp: string = e.target.value;
        const values: string[] = tmp.split(", ");
        if (values[1] == "+")
            increment(values[0]);
        else
            decrement(values[0]);
    }

    const mute = () => {
        let time: number = (hours * 60) + minutes;
        socket.emit("muteUser", {id: props.user, channelId: props.dest.id, minutes: time});
        props.handleClose();
    }

    useEffect(() => { 
        let intervalPlus: NodeJS.Timer;
        let intervalMinus: NodeJS.Timer;
        if (mouseOn && plus) {
            intervalPlus = setInterval(() => increment(time), 100);
        }
        if (mouseOn && !plus) {
            intervalMinus = setInterval(() => decrement(time), 100);
        }
        return () => {
            clearInterval(intervalPlus);
            clearInterval(intervalMinus);
        }
    }, [mouseOn, hours, minutes])

    return (
        <React.Fragment>
            <li className="mute">
                <div>
                    Mute for:
                </div>
                <div>
                    <div>
                        <button value="hour, -" onClick={handleClick} onMouseDown={handleMouse} onMouseUp={handleMouse}>-</button>
                            <span>{hours}</span>h
                        <button value="hour, +" onClick={handleClick} onMouseDown={handleMouse} onMouseUp={handleMouse}>+</button>
                    </div>
                    <div>
                        <button value="minute, -" onClick={handleClick} onMouseDown={handleMouse} onMouseUp={handleMouse}>-</button>
                            <span>{minutes}</span>m
                        <button value="minute, +" onClick={handleClick} onMouseDown={handleMouse} onMouseUp={handleMouse}>+</button>
                    </div>
                </div>
                <button className="muteButton" onClick={mute}>Save</button>
            </li>
        </React.Fragment>
    )
}

function MemberList(props: {dest: IDest}) {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [members, setMembers] = useState<{user: {id: string, login: string}, status: string}[]>([]);
    const [onClickMute, setOnClickMute] = useState<boolean>(false);
    const [userToMute, setUserToMute] = useState<string>("");

    const showMuteFor = (e: any) => {
        setUserToMute(e.currentTarget.value);
        setOnClickMute((onClickMute) => !onClickMute)
    }

    const kickUser = (e: any) => {
        socket.emit("kickUser", {userToKick: e.currentTarget.value, channelId: props.dest.id});
    }
    
    const ban = (e: any) => {
        socket.emit("banUser", {id: e.currentTarget.value, channelId: props.dest.id});
    }

    const deOp = (e: any) => {
        socket.emit("makeHimNoOp", {userToNoOp: e.currentTarget.value, channelId: props.dest.id});
    }
    
    const doOp = (e: any) => {
        socket.emit("makeHimOp", {userToOp: e.currentTarget.value, channelId: props.dest.id});
    }

    const handleCloseMuteFor = () => {
        setOnClickMute((onClickMute) => !onClickMute);
    }

    useEffect(() => {
        socket.emit('listUsersChann', {channelId: props.dest.id}); 
        socket.on('listUsersChann', (list: {user: {id: string, login: string}, status: string}[]) => {
            setMembers(list);
        })
        socket.on("userLeaveChannel", (userId: string) => {
            setMembers((members) => {
                let newMembers = [...members].filter((member) => {
                    return member.user.id != userId;
                });
                return newMembers;
            });
        })
        socket.on("newUserInChannel", (id: string, login: string) => {
            setMembers(members => {
                let user: {user: {id: string, login: string}, status: string} = {
                    user: {
                        id: id,
                        login: login
                    },
                    status: "normal"
                }
                let newMembers = [...members, user];
                newMembers.sort((a, b) => {
                    if (a.status == "god" && b.status != "god")
                        return (-1)
                    if (a.status == "op") {
                        if (b.status == "god")
                            return (1)
                        if (b.status == "normal")
                            return (-1) 
                    }
                    if (a.status == "normal" && b.status != "normal")
                        return (1)
                    return (a.user.login.localeCompare(b.user.login))
                });
                return newMembers;
            });
        })

        return () => {
            socket.off('listUsersChann');
            socket.off('userLeaveChannel');
            socket.off('newUserInChannel');
        }
    }, [])

    return (
        <React.Fragment>
            <ul className="memberList">{
                members.map(
                (member, id) => {
                    let iconStatus: JSX.Element = null!;
                    if (member.status === "god")
                        iconStatus = <FontAwesomeIcon className="iconStatus" icon={faKiwiBird} />;
                    else if (member.status === "op")
                        iconStatus = <FontAwesomeIcon className="iconStatus" icon={faFeather} />;
    
                    if (member.user.id !== me.sub) {
                        if (props.dest.status == "normal")
                            return (<li key={id}><div>{member.user.login}{iconStatus}</div></li>)
                        else if (props.dest.status == "op") {
                            if (member.status == "normal")
                                return (<li key={id}><div>{member.user.login}{iconStatus}</div>
                                        <div>
                                            <button className="memberButton" data-hover-text="Mute" value={member.user.id} onClick={showMuteFor}>
                                                <FontAwesomeIcon className="iconAction" icon={faCommentSlash} />
                                            </button>
                                            <button className="memberButton" data-hover-text="Kick" value={member.user.id} onClick={kickUser}>
                                                <FontAwesomeIcon className="iconAction" icon={faRightFromBracket} />
                                            </button>
                                            <button className="memberButton" data-hover-text="Ban" value={member.user.id} onClick={ban}>
                                                <FontAwesomeIcon className="iconAction" icon={faBan} />
                                            </button>
                                        </div></li>)
                            else if (member.status == "op" || member.status == "god")
                                return (<li key={id}><div>{member.user.login}{iconStatus}</div></li>)
                        }
                        else if (props.dest.status == "god")
                            return (<li key={id}><div>{member.user.login}{iconStatus}</div>
                            <div>
                                { member.status == "op" ? 
                                (<button className="memberButton" data-hover-text="Downgrade" value={member.user.id} onClick={deOp}>
                                    <FontAwesomeIcon className="iconAction" icon={faBroom} />
                                </button>) :
                                (<button className="memberButton" data-hover-text="Upgrade" value={member.user.id} onClick={doOp}>
                                    <FontAwesomeIcon className="iconAction" icon={faWandMagicSparkles} />
                                </button>) }
                                <button className="memberButton" data-hover-text="Mute" value={member.user.id} onClick={showMuteFor}>
                                    <FontAwesomeIcon className="iconAction" icon={faCommentSlash} />
                                </button>
                                <button className="memberButton" data-hover-text="Kick" value={member.user.id} onClick={kickUser}>
                                    <FontAwesomeIcon className="iconAction" icon={faRightFromBracket} />
                                </button>
                                <button className="memberButton" data-hover-text="Ban" value={member.user.id} onClick={ban}>
                                    <FontAwesomeIcon className="iconAction" icon={faBan} />
                                </button>
                            </div></li>)
                    }
                    else
                        return (<li key={id}><div>{member.user.login}{iconStatus}</div></li>)
                }
                )}
            </ul>
            {onClickMute && <MuteFor user={userToMute} dest={props.dest} handleClose={handleCloseMuteFor} />}
        </React.Fragment>
    )
}

class InviteUser extends React.Component<{dest: IDest}, {
    onClickInvite: boolean, 
    users: {id: string, name: string}[],
    filtered: {id: string, name: string}[],
    userToInvite: string,
    isDropdown: boolean}
    > {
    constructor(props: {dest: IDest}) {
        super(props);
        this.state = {
            onClickInvite: false,
            users: [],
            filtered: [],
            userToInvite: "",
            isDropdown: false,
        }
        this.showInvite = this.showInvite.bind(this);
        this.inviteUser = this.inviteUser.bind(this);
        this.fetchUsers = this.fetchUsers.bind(this);
        this.displayList = this.displayList.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;

    showInvite() {
        this.setState({ onClickInvite: !this.state.onClickInvite });
        this.context.socket.emit('listUsersChann', {channelId: this.props.dest.id});
    }
    
    inviteUser(event: any) {
        event.preventDefault();
        this.context.socket.emit('inviteUser', {userToInvite: event.target.value, channelId: this.props.dest.id});
        this.setState({ userToInvite: "", onClickInvite: !this.state.onClickInvite });
    }
    
    fetchUsers(event: any) {
        this.context.socket.emit('listUsersChann', {channelId: this.props.dest.id});
        this.setState({ isDropdown: !this.state.isDropdown});
        this.displayList(event);
    }

    displayList(event: any) {
        // console.log("displayList")
        // console.log(this.state.users);
        this.setState({ userToInvite: event.target.value });
        if (event.target.value) {
            const filteredUsers: {id: string, name: string}[] = 
            this.state.users.filter((user) => user.name.startsWith(event.target.value));
            this.setState({ filtered: filteredUsers });
        }
        else {
            this.setState({ filtered: this.state.users });
        }
    }
    
    componentDidMount(): void {
        this.context.socket.on('listUsersChann', (list: {user: {id: string, login: string}, status: string}[]) => {
            // console.log("listUsersChann")
            const members: {user: {id: string, login: string}, status: string}[] = list.map(member => (member));
            userService.getAllUsers()
            .then(response => {
                let newUserList: {id: string, name: string}[] =
                response.data
                    .filter((user: {id: string, login: string}) => {
                        for (let elt of members) {
                            if (elt.user.login === user.login) {
                                return false;
                            }
                        }
                        return true;
                    })
                    .map((user: {id: string, login: string}) => ({id: user.id, name: user.login}));
                newUserList.sort((a, b) => {return a.name.localeCompare(b.name);});
                this.setState({ users: newUserList, filtered: newUserList });
            })
            .catch(error => {
                console.log(error);
            })
        })
    }

    componentWillUnmount(): void {
        this.context.socket.off('listUsersChann');
    }

    render() {
        return (
            <React.Fragment>
                <li onClick={this.showInvite}>Invite</li>
                {this.state.onClickInvite && (
                    <div className="invite"> 
                        <form className="searchbar" onSubmit={this.inviteUser}>
                            <input type="text" onClick={this.fetchUsers} onChange={this.displayList} value={this.state.userToInvite} placeholder="Search"/>
                        </form>
                        {(this.state.filtered.length != 0 && this.state.isDropdown) &&
                            <ul>
                                {this.state.filtered.map((elt: {id: string, name: string}, id: number) => (
                                <li key={id}><button value={elt.name} onClick={this.inviteUser}>{elt.name}</button></li>
                                ))}
                            </ul>
                        }
                    </div>
                )}
            </React.Fragment>
        )
    } 
}

export function SidebarChannel(props: {dest: IDest, handleClose: any}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);
    const [onClickMembers, setOnClickMembers] = useState<boolean>(false);
    const [onClickSettings, setOnClickSettings] = useState<boolean>(false);
    const [onClickUnban, setOnClickUnban] = useState<boolean>(false);
    const [bans, setBans] = useState<{id: string, login: string}[]>([]);

    const showMembers = () => {
        setOnClickMembers((onClickMembers) => !onClickMembers)
    }

    const showSettings = () => {
        setOnClickSettings((onClickSettings) => !onClickSettings)
    }

    const showUnban = () => {
        setOnClickUnban((onClickUban) => !onClickUban)
    }

    const handleClickOutside = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            props.handleClose();
        }
    }

    const unban = (e: any) => {
        e.preventDefault();
        socket.emit("unbanUser", {userId: e.target.value, channelId: props.dest.id});
    }

    const leaveChannel = () => {
        socket.emit('leaveChannel', {channelId: props.dest.id});
        props.handleClose();
    }

    const deleteChannel = () => {
        socket.emit('destroyChannel', {channelId: props.dest.id});
        props.handleClose();
    }
    
    useEffect(() => {
        socket.on("banList", (array: {id: string, login: string}[]) => {
            setBans(array);
        })
        socket.on("newUnban", (userId: string) => {
            socket.emit("getBanList", {channelId: props.dest.id});
            let newArray: {id: string, login: string}[] = bans.filter(
                (ban: {id: string, login: string}) => {return (ban.id != userId)}
            );
            setBans(newArray);
        })
        socket.on("newBan", (id: string, login: string) => {
            socket.emit("getBanList", {channelId: props.dest.id});
            let newArray: {id: string, login: string}[] = [...bans, {id, login}];
            setBans(newArray);
        })
        return () => {
            socket.off('banList');
            socket.off('newUnban');
            socket.off('newBan');
        }
    }, [])
    
    useEffect(() => {
        socket.emit("getBanList", {channelId: props.dest.id});
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [ref]);

    return (
        <div className="sidebarContent" ref={ref}>
          <span className="closeIcon" onClick={props.handleClose}>x</span>
          <div className="navRight">
            <h1>{props.dest.name}</h1>
            <ul className="paramMenu">
                <li onClick={showMembers}>Members</li>
                {onClickMembers && <MemberList dest={props.dest} />}
                {(!props.dest.channel?.inviteOnly || (props.dest.channel?.inviteOnly && props.dest.status !== "normal")) ? (
                    <InviteUser dest={props.dest} /> ) : null }
                {(props.dest.status === "god" && bans.length != 0) ? (
                    <React.Fragment>
                        <li onClick={showUnban}>Unban</li>
                        {onClickUnban && 
                            <ul className="memberList">
                                {bans.map((ban, id) => (
                                    <li key={id}><button value={ban.id} onClick={unban}>{ban.login}</button></li>
                                ))}
                            </ul>
                        }
                    </React.Fragment>
                ) : null }
                {props.dest.status !== "normal" ? (
                    <React.Fragment>
                        <li onClick={showSettings}>Settings</li>
                        {onClickSettings && (
                           <ModifyChannel channel={props.dest.channel!}/>
                        )}
                    </React.Fragment>
                ) : null }
                {props.dest.status !== "god" ? (
                <li className="outChannel" onClick={leaveChannel}>Leave</li>) : (<li className="outChannel" onClick={deleteChannel}>Delete</li>)}
            </ul>
          </div>
      </div>
    )
}

export function SidebarUser(props: {handleClose: any, dest: IDest}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);

    const addFriend = () => {
        socket.emit("friendRequest", {userId: props.dest.id});
    }

    const blockUser = () => {
        socket.emit("blockUser", {id: props.dest.id});
    }

    useEffect(() => {
        const handleClickOutside = (e: any) => {
            if (ref.current && !ref.current.contains(e.target)) {
                props.handleClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [ref]);

    return (
        <div className="sidebarContent" ref={ref}>
            <span className="closeIcon" onClick={props.handleClose}>x</span>
            <div className="navRight">
                <h1>{props.dest.name}</h1>
                <ul className="paramMenu">
                    <li><NavLink id="navlink" to={`/profile/${props.dest.name}`}>See profile</NavLink></li>
                    <li onClick={addFriend}>Add Friend</li>
                    <li>Propose a game<br></br>
                        <button>normal</button>
                        <button>super</button>
                    </li>
                    <li onClick={blockUser}>Block</li>
                </ul>
            </div>
        </div>
    )
}

export function Header(props: {dest: IDest}) {
    const isChannel: boolean = props.dest.isChannel;
    const [sidebarIsOpen, setSidebarIsOpen] = useState<boolean>(false);

    const onClickSidebar = () => {
        setSidebarIsOpen(!sidebarIsOpen);
    }

    return (
        <div id="channelHeader">
            <div className={sidebarIsOpen ? "sidebar show" : "sidebar"}>
                {sidebarIsOpen && (props.dest.isChannel ? <SidebarChannel dest={props.dest} handleClose={onClickSidebar}/> : <SidebarUser handleClose={onClickSidebar} dest={props.dest}/>)}
            </div>
            <h1>  
            {isChannel ? <FontAwesomeIcon className="iconChannels" icon={faUserGroup} />
            : <FontAwesomeIcon className="iconChannels" icon={faUser} /> }
                {props.dest.name}
            </h1>
            {props.dest.name !== "general" && <button onClick={onClickSidebar}><FontAwesomeIcon className="iconChannels" icon={faEllipsisVertical} /></button>}
        </div>
    )
}

