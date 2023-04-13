import React, { useState, useContext, useEffect, useRef } from "react";
import { SocketContext } from "../context";
import { useForm } from 'react-hook-form';
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { IDest, IChannel } from "./Chat_models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faBroom, faCommentSlash, faEllipsisVertical, faFeather, faKiwiBird, faMagnifyingGlass, faRightFromBracket, faUser, faUserGroup, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

function ModifyChannel(props: {channel: IChannel}) {
    const {socket} = useContext(SocketContext);
    const { register, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
        id: props.channel.id,
        name: props.channel.name,
        password: props.channel.password,
        channelPass: props.channel.channelPass,
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

function MemberList(props: {dest: IDest}) {
    const {socket} = useContext(SocketContext);
    const me: JwtPayload = accountService.readPayload()!;
    const [members, setMembers] = useState<{user: {id: string, login: string}, status: string, connected: boolean}[]>([]);
    const [onClickMute, setOnClickMute] = useState<boolean>(false);
    const [userToMute, setUserToMute] = useState<string>("");
    // const [minutes, setUserToMute] = useState<string>("");
    // const [userToMute, setUserToMute] = useState<string>("");

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

    const mute = () => {
        socket.emit("muteUser", {id: userToMute, channelId: props.dest.id, minutes: 10});
    }

    const deOp = (e: any) => {
        socket.emit("makeHimNoOp", {userToNoOp: e.currentTarget.value, channelId: props.dest.id});
    }
    
    const doOp = (e: any) => {
        socket.emit("makeHi   mOp", {userToOp: e.currentTarget.value, channelId: props.dest.id});
    }

    useEffect(() => {
        socket.emit('listUsersChann', {channelId: props.dest.id}); 
        socket.on('listUsersChann', (list: {user: {id: string, login: string}, status: string, connected: boolean}[]) => {
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
        socket.on("newUserInChannel", (id: string, login: string, connected: boolean) => {
            setMembers(members => {
                let user: {user: {id: string, login: string}, status: string, connected: boolean} = {
                    user: {
                        id: id,
                        login: login
                    },
                    status: "normal",
                    connected: connected
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
    }, [])

    return (
        <div>
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
                                            <button value={member.user.id} onClick={showMuteFor}><FontAwesomeIcon className="iconAction" icon={faCommentSlash} /></button>
                                            <button value={member.user.id} onClick={kickUser}><FontAwesomeIcon className="iconAction" icon={faRightFromBracket} /></button>
                                            <button value={member.user.id} onClick={ban}><FontAwesomeIcon className="iconAction" icon={faBan} /></button>
                                            </div></li>)
                            else if (member.status == "op" || member.status == "god")
                                return (<li key={id}><div>{member.user.login}{iconStatus}</div></li>)
                        }
                        else if (props.dest.status == "god")
                            return (<li key={id}><div>{member.user.login}{iconStatus}</div>
                            <div>
                            { member.status == "op" ? 
                            (<button value={member.user.id} onClick={deOp}><FontAwesomeIcon className="iconAction" icon={faBroom} /></button>) :
                            (<button value={member.user.id} onClick={doOp}><FontAwesomeIcon className="iconAction" icon={faWandMagicSparkles} /></button>) }
                            <button value={member.user.id} onClick={showMuteFor}><FontAwesomeIcon className="iconAction" icon={faCommentSlash} /></button>
                            <button value={member.user.id} onClick={kickUser}><FontAwesomeIcon className="iconAction" icon={faRightFromBracket} /></button>
                            <button value={member.user.id} onClick={ban}><FontAwesomeIcon className="iconAction" icon={faBan} /></button>
                            </div></li>)
                    }
                    else
                        return (<li key={id}><div>{member.user.login}{iconStatus}</div></li>)
                }
                )}
            </ul>
            {onClickMute && (
                <React.Fragment>
                    <li>
                       Mute for
                       <button onClick={mute}>Save</button>
                       </li>
                </React.Fragment>
           )}
        </div>
    )
}

export function SidebarChannel(props: {dest: IDest, handleClose: any}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);
    const [onClickMembers, setOnClickMembers] = useState<boolean>(false);
    const [onClickUnban, setOnClickUnban] = useState<boolean>(false);
    const [onClickSettings, setOnClickSettings] = useState<boolean>(false);
    const [onClickInvite, setOnClickInvite] = useState<boolean>(false);
    const [userToInvit, setUserToInvit] = useState<string>("");
    const [userToUnban, setUserToUnban] = useState<string>("");

    const showMembers = () => {
        setOnClickMembers((onClickMembers) => !onClickMembers)
    }
    
    const showUnban = () => {
        setOnClickUnban((onClickUban) => !onClickUban)
    }

    const showSettings = () => {
        setOnClickSettings((onClickSettings) => !onClickSettings)
    }
    
    const showInvite = () => {
        setOnClickInvite((onClickInvite) => !onClickInvite)
    }
    
    const onChangeInvite = (e: any) => {
        setUserToInvit(e.target.value);
    }

    const onChangeUnban = (e: any) => {
        setUserToUnban(e.target.value);
    }

    const unban = (e: any) => {
        console.log(e.target.value, props.dest.id)
        e.preventDefault();
        socket.emit("unbanUser", {name: userToUnban, channelId: props.dest.id});
        setUserToUnban("");
    }

    const handleClickOutside = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            props.handleClose();
        }
    }
     
    const inviteUser = (event: any) => {
        event.preventDefault();
        socket.emit('inviteUser', {userToInvite: userToInvit, channelId: props.dest.id});
        setUserToInvit("");
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
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            socket.off('listUsersChann');
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
                {(props.dest.status === "god") ? (
                     <React.Fragment>
                         <li onClick={showUnban}>Unban</li>
                         {onClickUnban && (
                             <div className="searchbar">
                                 <input type="text" onChange={onChangeUnban} value={userToUnban} placeholder="Search"/>
                                 <FontAwesomeIcon className="svgSearch" icon={faMagnifyingGlass} onClick={unban} />
                             </div>)
                         }
                     </React.Fragment>
                ) : null }
                {(!props.dest.channel?.inviteOnly || (props.dest.channel?.inviteOnly && props.dest.status !== "normal")) ? (
                     <React.Fragment>
                         <li onClick={showInvite}>Invite</li>
                         {onClickInvite && (
                             <div className="searchbar">
                                 <input type="text" onChange={onChangeInvite} value={userToInvit} placeholder="Search"/>
                                 <FontAwesomeIcon className="svgSearch" icon={faMagnifyingGlass} onClick={inviteUser} />
                             </div>)
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
        socket.emit("friendRequest", {id: props.dest.id});
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
                    <li><NavLink to={`/profile/${props.dest.name}`}>See profile</NavLink></li>
                    <li onClick={addFriend}>Add Friend</li>
                    <li>Propose a game</li>
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

