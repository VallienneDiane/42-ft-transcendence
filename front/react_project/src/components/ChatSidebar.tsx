import React, { useState, useContext, useEffect, useRef } from "react";
import SocketContext from "./context";
import { IDest } from "../models";

function ParamsChannel(props: {dest: IDest, handleClose: any}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);
    const [members, setMembers] = useState<string[]>([]);

    const leaveChannel = () => {
        socket.emit('leaveChannel', props.dest.Loc);
        props.handleClose();
    }

    const inviteUser = () => {
        // coder l'invitation : search user
        socket.emit('inviteUser', "nami", props.dest.Loc);
    }

    useEffect(() => {
        socket.emit('listUsersChann', props.dest.Loc);
        socket.on('listUsersChann', (list: string[]) => {
            setMembers(list);
        })
        const handleClickOutside = (e: any) => {
            if (ref.current && !ref.current.contains(e.target)) {
                props.handleClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            socket.off('listUsersChann');
        }
    }, [ref]);

    return (
        <div className="sidebar" ref={ref}>
          <span onClick={props.handleClose}><svg className="iconChannels" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg></span>
          <div className="navRight">
            <h1>{props.dest.Loc}</h1>
            {/* <div className="blocMemberList">
                <h2>Members</h2>
                <ul className="memberList">{members.map((member) => {return (
                    <li>{member}</li>
                )})}
                </ul>
            </div> */}
            <div className="bloc2">
                {props.dest.channel?.inviteOnly ? (
                <button onClick={inviteUser}>Invite</button>
                ) : null}
                {props.dest.isOp ? (
                    <React.Fragment>
                        <button>Settings</button>
                    </React.Fragment>
                ) : null}
            </div>
          </div>
            <button onClick={leaveChannel}>Leave</button>
      </div>
    )
}

function SidebarUser(props: {handleClose: any, channel: string, isChannel: boolean}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);

    const addFriend = () => {

    }

    const blockUser = () => {

    }

    const kickUser = () => {
        // search
        socket.emit('kickUser', "nami", props.channel);
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
        <div className="sidebar" ref={ref}>
            <ul className="paramMenu">
                <li className="paramItem">
                    <button>See profile</button>
                </li>
                <li className="paramItem">
                    <button onClick={addFriend}>Add Friend</button>
                </li>
                <li className="paramItem">
                    <button>Propose a game</button>
                </li>
                <li className="paramItem">
                    <button onClick={blockUser}>Block</button>
                </li>
                {props.isChannel && <li className="paramItem">
                    <button onClick={kickUser}>Kick</button> // couleur différente
                </li>}
            </ul>
        </div>
    )
}

function Header(props: {dest: IDest}) {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const isChannel: boolean = props.dest.isChannel;

    const onClick = () => {
        setIsOpen((prevSate) => !prevSate);
    };

    return (
        <div className="channelHeader">
            <h1>  
            {isChannel ? <svg className="iconChannels" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM609.3 512H471.4c5.4-9.4 8.6-20.3 8.6-32v-8c0-60.7-27.1-115.2-69.8-151.8c2.4-.1 4.7-.2 7.1-.2h61.4C567.8 320 640 392.2 640 481.3c0 17-13.8 30.7-30.7 30.7zM432 256c-31 0-59-12.6-79.3-32.9C372.4 196.5 384 163.6 384 128c0-26.8-6.6-52.1-18.3-74.3C384.3 40.1 407.2 32 432 32c61.9 0 112 50.1 112 112s-50.1 112-112 112z"/></svg>
            : <svg className="iconChannels" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg> }
                {props.dest.Loc}
            </h1>
            {props.dest.Loc !== "general" && <button onClick={onClick}><svg className="iconChannels" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 512"><path d="M56 472a56 56 0 1 1 0-112 56 56 0 1 1 0 112zm0-160a56 56 0 1 1 0-112 56 56 0 1 1 0 112zM0 96a56 56 0 1 1 112 0A56 56 0 1 1 0 96z"/></svg></button>}
            {isOpen && (isChannel ? <ParamsChannel dest={props.dest} handleClose={onClick}/> : <SidebarUser handleClose={onClick} channel='' isChannel={false}/>)}
        </div>
    )
}

export default Header;
