import React, { createRef, useContext, useState, useRef, useEffect } from "react";
import { Socket } from 'socket.io-client'
import SocketContext from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { userService } from "../../services/user.service";
import { UserData, Message, IMessageEntity, IChannel } from "../../models";

function JoinChannelPopUp(props: {handleClose: any, channelName: string}) {
    const {socket} = useContext(SocketContext);
    const [pass, setPass] = useState<string>('');
    const ref = useRef<HTMLDivElement>(null);

    const handleClickOutside = (e: any) => {
        if (ref.current && !ref.current.contains(e.target)) {
            props.handleClose('');
        }
    }

    const onKeyPress = (event: any) => {
        if (event.keyCode === 27) {
            props.handleClose('');
        }
    }

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", onKeyPress);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", onKeyPress);
        }
    }, [ref]);

    const handlePass = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPass(event.target.value);
    }

    const handlerJoinPass = (event: any) => {
        event.preventDefault();
        socket.emit('joinChannel', {channelName: props.channelName, channelPass: pass});
        setPass('');
        props.handleClose('');
    }

    return (
        <div className="popup">
            <div className="box" ref={ref}>
                <h1>{props.channelName}</h1>
                <form onSubmit={handlerJoinPass}>
                    <input type="password" placeholder="Enter channel pass here..." value={pass} onChange={handlePass} />
                    <button type="submit">Enter</button>
                </form>
            </div>
        </div>
    )
}

class SearchElement extends React.Component<{socket: Socket, popupAction: any, handleClose: any, name: string, isChannel: boolean, password: boolean, isClickable: boolean}, {openPopup: boolean}> {
    constructor(props: {socket: Socket, popupAction: any, handleClose: any, name: string, isChannel: boolean, password: boolean, isClickable: boolean}) {
        super(props);
        this.onClickChatting = this.onClickChatting.bind(this);
        this.handlerJoinChannel = this.handlerJoinChannel.bind(this);
    }

    handlerJoinChannel() {
        if (!this.props.password) {
            this.props.socket.emit('joinChannel', {channelName: this.props.name, channelPass: null});
            this.props.handleClose();
        }
        else {
            this.props.handleClose();
            this.props.popupAction(this.props.name);
        }
    }

    onClickChatting() {
        this.props.socket.emit('changeLoc', {Loc: this.props.name, isChannel: false});
        this.props.handleClose();
    }

    render() {
        return(
        <li className="searchElement">
            {this.props.isClickable && this.props.isChannel
                && <button onClick={this.handlerJoinChannel}>{this.props.name}</button>}
            {this.props.isClickable && !this.props.isChannel
                && <button onClick={this.onClickChatting}>{this.props.name}</button>}
            {!this.props.isClickable && <p>{this.props.name}</p>}
        </li>);
    }
}

class SearchChat extends React.Component<{action: any, action2: any, socket: Socket}, {
    text: string,
    popupIsOpen: boolean,
    channelToUnlock: string,
    users: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[],
    channels: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[],
    filtered: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[]
    isDropdown: boolean}
    > {
    constructor(props:{action: any, action2: any, socket: Socket}) {
        super(props);
        this.state = {
            text: '',
            popupIsOpen: false,
            channelToUnlock: '',
            users: [],
            channels: [],
            filtered: [],
            isDropdown: false,
        }
        this.closeSearchList = this.closeSearchList.bind(this);
        this.fetchUsers = this.fetchUsers.bind(this);
        this.showSearchList = this.showSearchList.bind(this);
        this.displayList = this.displayList.bind(this);
        this.resetFiltered = this.resetFiltered.bind(this);
        this.onClickPopup = this.onClickPopup.bind(this);
    }
    ref = createRef<HTMLUListElement>();

    onClickPopup(chanName: string) {
        this.setState({ popupIsOpen: !this.state.popupIsOpen, channelToUnlock: chanName });
    }
    
    closeSearchList(e: any) {
        if (this.ref.current && !this.ref.current.contains(e.target)) {
            this.setState({ isDropdown: !this.state.isDropdown });
        }
    }

    fetchUsers() { // récupération de tous les users, sauf moi-même
        userService.getAllUsers()
        .then(response => {
            const playload: JwtPayload = accountService.readPayload()!;
            const users: string[] = response.data.map((user: UserData) => user.login);
            let newUserList: {name:string, isChannel:boolean, password: boolean, isClickable: boolean}[] = [];
            users.forEach((user: string) => {
                if (playload.login !== user)
                    newUserList.push({name: user, isChannel: false, password: false, isClickable: true});
            })
            console.log("users", newUserList);
            this.setState({users: newUserList});
        })
        .catch(error => {
            console.log(error);
        })
    }
    
    compileFiltered( users: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[],
        channels: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] ) {
        let newFiltered: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = [];

        if (users.length > 0) {
            if (channels.length > 0)
                newFiltered = [ {name: "Users : ", isChannel: false, password: false, isClickable: false}, ...users,
                                {name: "Channels : ", isChannel: true, password: false, isClickable: false}, ...channels ];
            else
                newFiltered = [{name: "Users : ", isChannel: false, password: false, isClickable: false}, ...users];
        }
        else if (channels.length > 0)
            newFiltered = [{name: "Channels : ", isChannel: true, password: false, isClickable: false}, ...channels];
        else
            newFiltered = [];

        const filtered: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = newFiltered;
        return filtered;
    }

    showSearchList(event: any) {
        this.setState({ isDropdown: !this.state.isDropdown });
        this.displayList(event); 
    }

    displayList(event: any) {
        this.setState({ text: event.target.value });

        if (event.target.value) {
            this.setState(() => {
                const filteredUsers: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] =
                this.state.users.filter((user: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}) =>
                    user.name.startsWith(event.target.value));
                const filteredChannels: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] =
                this.state.channels.filter((channel: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}) =>
                    channel.name.startsWith(event.target.value));

                const filtered = this.compileFiltered(filteredUsers, filteredChannels);
                return { filtered };
            });
        }
        else {
            this.setState(() => {
                const filtered = this.compileFiltered(this.state.users, this.state.channels);
                return { filtered };
            })
        }
    }

    resetFiltered() {
        this.setState({text: '', filtered: []});
        this.setState({ isDropdown: !this.state.isDropdown });
    }

    componentDidMount(): void {
        document.addEventListener("mousedown", this.closeSearchList);
        this.fetchUsers();

        this.props.socket.emit('listChannel');
        this.props.socket.on('listChannel', (strs: {channelName: string, password: boolean}[]) => {
            let newChanList: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = [];
            for (let str of strs)
                newChanList.push({name: str.channelName, password: str.password, isChannel: true, isClickable: true});
            // console.log("channels", newChanList);
            this.setState({channels: newChanList})});
            
        this.props.socket.on('newUserConnected', () => {
            this.fetchUsers()});

        this.props.socket.on('newLocChannel', (channel: IChannel, isOp: boolean, chanHistory: IMessageEntity[]) => {
            let newHistory: Message[] = [];
            for (let elt of chanHistory) {
                newHistory.push({id: elt.date.toString(), text: elt.content, sender: elt.sender})
            }
            this.props.action(newHistory);
            this.props.action2({Loc: channel.name, isChannel: true, channel: channel, isOp: isOp});
        })

        this.props.socket.on('newLocPrivate', (userName: string, chanHistory: IMessageEntity[]) => {
            let newHistory: Message[] = [];
            for (let elt of chanHistory) {
                newHistory.push({id: elt.date.toString(), text: elt.content, sender: elt.sender})
            }
            this.props.action(newHistory);
            this.props.action2({Loc: userName, isChannel: false});
        })
    }

    componentWillUnmount(): void {
        document.removeEventListener("mousedown", this.closeSearchList);
        this.props.socket.off('listChannel');
        this.props.socket.off('newUserConnected');
        this.props.socket.off('newLocChannel');
        this.props.socket.off('newLocPrivate');
    }

    render() {
        // console.log(this.state.filtered);
        return (
            <div id="searchbarWrapper">
                <div className="searchbar">
                    <input type="text" onChange={this.displayList} onClick={this.showSearchList} value={this.state.text} placeholder="Search"/>
                    <svg className="svgSearch" viewBox="0 0 24 24"><path fill="#666666" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                    </svg>
                </div>
                {(this.state.filtered.length != 0 && this.state.isDropdown) && <ul ref={this.ref}>
                    {this.state.filtered.map((user: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}, id: number) => (
                        <SearchElement  key={id} socket={this.props.socket} handleClose={this.resetFiltered}
                                        popupAction={this.onClickPopup} name={user.name} isChannel={user.isChannel}
                                        password={user.password} isClickable={user.isClickable} />
                    ))}
                </ul>}
                {this.state.popupIsOpen && <JoinChannelPopUp handleClose={this.onClickPopup} channelName={this.state.channelToUnlock} />}
            </div>
        )
    }
}

export default SearchChat;