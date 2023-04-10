import React, { useState, useContext, useEffect, useRef } from "react";
import { SocketContext } from "../context";
import { useForm } from 'react-hook-form';
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { IDest, IChannel } from "./Chat_models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical, faUser, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

function ModifyChannel(props: {channel: IChannel}) {
    const {socket} = useContext(SocketContext);
    const { register, formState: { errors }, handleSubmit } = useForm<IChannel>({ 
        defaultValues: { 
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
    const [members, setMembers] = useState<{user: {id: string, login: string}, status: string, connected: boolean}[]>([]);
    const [onClickMembers, setOnClickMembers] = useState<boolean>(false);
    const [onClickSettings, setOnClickSettings] = useState<boolean>(false);
    const me: JwtPayload = accountService.readPayload()!;
    const [myGrade, setGrade] = useState<string>("normal");

    const leaveChannel = () => {
        // console.log(props.dest.id)
        socket.emit('leaveChannel', {channelId: props.dest.id});
        props.handleClose();
    }

    const inviteUser = () => {
        // coder l'invitation : search user
        socket.emit('inviteUser', "nami", props.dest.id);
    }

    const listMembers = () => {
        setOnClickMembers((onClickMembers) => !onClickMembers)
    }

    const showSettings = () => {
        setOnClickSettings((onClickSettings) => !onClickSettings)
    }

    const showUserParam = () => {
        console.log("blop");
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
                <li onClick={listMembers}>Members</li>
                {onClickMembers && (
                    <ul className="memberList">{
                        members.map(
                        (member, id) => {
                            if (member.user.id !== me.sub) {
                                if (props.dest.status == "normal")
                                    return (<li key={id}><button onClick={showUserParam}>{member.user.login}</button> </li>)
                                else if (props.dest.status == "op" && member.status == "normal")
                                    return (<li key={id}><button onClick={showUserParam}>{member.user.login}</button> <button value={member.user.id} onClick={kickUser}>kickUser</button></li>)
                                else if (props.dest.status == "god")
                                    return (<li key={id}><button onClick={showUserParam}>{member.user.login}</button> <button value={member.user.id} onClick={kickUser}>kickUser</button>
                                    { member.status == "op" ? (<button onClick={deOp}>deOp</button>) : (<button onClick={doOp}>doOp</button>) }
                                    </li>)
                            }
                            else
                                return (<li key={id}>{member.user.login}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M288 192h17.1c22.1 38.3 63.5 64 110.9 64c11 0 21.8-1.4 32-4v4 32V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V339.2L248 448h56c17.7 0 32 14.3 32 32s-14.3 32-32 32H160c-53 0-96-43-96-96V192.5c0-16.1-12-29.8-28-31.8l-7.9-1C10.5 157.6-1.9 141.6 .2 124s18.2-30 35.7-27.8l7.9 1c48 6 84.1 46.8 84.1 95.3v85.3c34.4-51.7 93.2-85.8 160-85.8zm160 26.5v0c-10 3.5-20.8 5.5-32 5.5c-28.4 0-54-12.4-71.6-32h0c-3.7-4.1-7-8.5-9.9-13.2C325.3 164 320 146.6 320 128v0V32 12 10.7C320 4.8 324.7 .1 330.6 0h.2c3.3 0 6.4 1.6 8.4 4.2l0 .1L352 21.3l27.2 36.3L384 64h64l4.8-6.4L480 21.3 492.8 4.3l0-.1c2-2.6 5.1-4.2 8.4-4.2h.2C507.3 .1 512 4.8 512 10.7V12 32v96c0 17.3-4.6 33.6-12.6 47.6c-11.3 19.8-29.6 35.2-51.4 42.9zM400 128a16 16 0 1 0 -32 0 16 16 0 1 0 32 0zm48 16a16 16 0 1 0 0-32 16 16 0 1 0 0 32z"/></svg></li>)
                        }
                        )}
                    </ul>
                )}
                { props.dest.channel?.inviteOnly ? (
                    <li onClick={inviteUser}>Invite</li>
                ) : null }
                { props.dest.status ? (
                    <React.Fragment>
                        <li onClick={showSettings}>Settings</li>
                        {onClickSettings && (
                           <ModifyChannel channel={props.dest.channel!}/>
                        )}
                    </React.Fragment>
                ) : null }
                <li onClick={leaveChannel}>Leave</li>
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

