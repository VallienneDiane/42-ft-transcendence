import React, { useState, useContext, useEffect, useRef } from "react";
import { SocketContext } from "../context";
import { useForm } from 'react-hook-form';
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { IDest, IChannel } from "./Chat_models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faBroom, faEllipsisVertical, faFeather, faKiwiBird, faMagnifyingGlass, faUser, faUserGroup, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

function ModifyChannel(props: {channel: IChannel}) {
    const {socket} = useContext(SocketContext);
    const { register, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
        id: props.channel.id,
        name: props.channel.name,
        password: props.channel.password,
        channelPass: props.channel.channelPass,
        inviteOnly: props.channel.inviteOnly,
        hidden: props.channel.hidden } 
    });
    const [showChannelPass, setShowChannelPass] = useState<boolean>(false);

    const changeState = (event: any) => {
        setShowChannelPass(event.target.checked);
    }

    const onSubmit = (data: IChannel) => {
        console.log(data)
        socket.emit('modifyChannel', {
            id: props.channel.id,
            name: data.name,
            password: data.password,
            channelPass: data.channelPass,
            inviteOnly: data.inviteOnly,
            hidden: data.hidden,
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
                    <input className="inputChannel" {...register("channelPass", { required: true, minLength: 2, maxLength: 20, pattern: /^[A-Za-z0-9]+$/i })}
                        type="password"
                        placeholder=""
                    /> 
                </li>)}
            {showChannelPass && errors.channelPass && <div className="logError">Your password is not valid</div>}
            <li>Invite Only<input type="checkbox" {...register("inviteOnly")}/></li>
            <li>Hidden<input type="checkbox" {...register("hidden")}/></li>
            <li><button type="submit">Save</button></li>
        </form>
    )
}

export function SidebarChannel(props: {dest: IDest, handleClose: any}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);
    const me: JwtPayload = accountService.readPayload()!;
    const [members, setMembers] = useState<{user: {id: string, login: string}, status: string, connected: boolean}[]>([]);
    const [onClickMembers, setOnClickMembers] = useState<boolean>(false);
    const [onClickSettings, setOnClickSettings] = useState<boolean>(false);
    const [onClickInvite, setOnClickInvite] = useState<boolean>(false);
    const [myGrade, setGrade] = useState<string>("normal");
    const [userToInvit, setUserToInvit] = useState<string>("");

    const showMembers = () => {
        setOnClickMembers((onClickMembers) => !onClickMembers)
    }
    
    const showSettings = () => {
        setOnClickSettings((onClickSettings) => !onClickSettings)
    }
    
    const showInvite = () => {
        setOnClickInvite((onClickInvite) => !onClickInvite)
    }
    
    const onChange = (e: any) => {
        setUserToInvit(e.target.value);
    }

    const handleClickOutside = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            props.handleClose();
        }
    }
     
    const kickUser = (e: any) => {
        socket.emit("kickUser", {userToKick: e.target.value, channelId: props.dest.id});
    }
    
    const deOp = () => {
        console.log("deOp!");
    }
    
    const doOp = () => {
        console.log("doOp!");
    }

    const inviteUser = () => {
        socket.emit('inviteUser', userToInvit, props.dest.id);
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
        console.log("status", props.dest.status)
        console.log(props.dest.id)
        socket.emit('listUsersChann', {channelId: props.dest.id}); 
        socket.on('listUsersChann', (list: {user: {id: string, login: string}, status: string, connected: boolean}[]) => {
            console.log("list", list);
            setMembers(list);
        })
        socket.on("userLeaveChannel", (userId: string) => {
            setMembers((members) => {
                let newMembers = [...members].filter((member) => {
                    return member.user.id != userId
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
                {onClickMembers && (
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
                                else if (props.dest.status == "op" && member.status == "normal")
                                    return (<li key={id}><div>{member.user.login}{iconStatus}</div>
                                    <div><button value={member.user.id} onClick={kickUser}><FontAwesomeIcon className="iconAction" icon={faBan} /></button></div></li>)
                                else if (props.dest.status == "god")
                                    return (<li key={id}><div>{member.user.login}{iconStatus}</div>
                                    <div>
                                    { member.status == "op" ? (<button onClick={deOp}><FontAwesomeIcon className="iconAction" icon={faBroom} /></button>) : (<button onClick={doOp}><FontAwesomeIcon className="iconAction" icon={faWandMagicSparkles} /></button>) }
                                    <button value={member.user.id} onClick={kickUser}><FontAwesomeIcon className="iconAction" icon={faBan} /></button></div>
                                    </li>)
                            }
                            else
                                return (<li key={id}><div>{member.user.login}{iconStatus}</div></li>)
                        }
                        )}
                    </ul>
                )}
                {props.dest.channel?.inviteOnly ? (
                     <React.Fragment>
                         <li onClick={showInvite}>Invite</li>
                         {onClickInvite && (
                             <div className="searchbar">
                                 <input type="text" onChange={onChange} value={userToInvit} placeholder="Search"/>
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

    }

    const blockUser = () => {

    }

    const kickUser = () => {
        // search
        socket.emit('kickUser', "nami", props.dest.name);
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
                    {/* {props.dest.isChannel && props.dest.isOp && <li onClick={kickUser}>Kick</li>} */}
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

