import React, { createRef, useContext, useState, useRef, useEffect, ContextType } from "react";
import { Socket } from 'socket.io-client'
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { userService } from "../../services/user.service";
import { IChannel, ISearch, IMessage, IMessageReceived } from "./Chat_models";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function JoinChannelPopUp(props: {handleClose: any, channelId: string, channelName: string}) {
    const {socket} = useContext(SocketContext);
    const [pass, setPass] = useState<string>('');
    const ref = useRef<HTMLDivElement>(null);
    const [ incorrectCredentials, setIncorrectCredentials ] = useState<boolean>(false);
    const [ offSocket, setOffSocket ] = useState<boolean>(false);

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
        socket.on("incorrectPassword", () => {
            setIncorrectCredentials(true);
        });
        socket.on("correctPassword", () => {
            setOffSocket(true);
            setPass('');
            props.handleClose('');
        })
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", onKeyPress);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", onKeyPress);
            if (offSocket) {
                socket.off("wrong");
                socket.off("true");
            }
        }
    }, [ref]);

    const handlePass = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPass(event.target.value);
    }

    const handlerJoinPass = (event: any) => {
        event.preventDefault();
        socket.emit('joinChannel', {channelId: props.channelId, channelPass: pass});
    }

    return (
        <div className="popup">
            <div className="box" ref={ref}>
                <h1>{props.channelName}</h1>
                <form onSubmit={handlerJoinPass}>
                    <input type="password" placeholder="Enter channel pass here..." value={pass} onChange={handlePass} />
                    { incorrectCredentials && <div className="logError">Wrong password</div>}
                    <button type="submit">Enter</button>
                </form>
            </div>
        </div>
    )
}

class SearchElement extends React.Component<{popupAction: any, handleClose: any, elt: ISearch}> {
    constructor(props: {socket: Socket, popupAction: any, handleClose: any, elt: ISearch}) {
        super(props);
        this.onClickChatting = this.onClickChatting.bind(this);
        this.handlerJoinChannel = this.handlerJoinChannel.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;

    handlerJoinChannel() {
        if (!this.props.elt.password) {
            this.context.socket.emit('joinChannel', {channelId: this.props.elt.id, channelPass: null});
            this.props.handleClose();
        }
        else {
            this.props.handleClose();
            this.props.popupAction(this.props.elt);
        }
    }

    onClickChatting() {
        this.context.socket.emit('changeLoc', {loc: this.props.elt.id, isChannel: false});
        this.props.handleClose();
    }

    render() {
        return(
        <li className="searchElement">
            {this.props.elt.isClickable && this.props.elt.isChannel
                && <button onClick={this.handlerJoinChannel}>{this.props.elt.name}</button>}
            {this.props.elt.isClickable && !this.props.elt.isChannel
                && <button onClick={this.onClickChatting}>{this.props.elt.name}</button>}
            {!this.props.elt.isClickable && <p>{this.props.elt.name}</p>}
        </li>);
    }
}

class SearchChat extends React.Component<{handleHistory: any, changeLoc: any}, {
    text: string,
    popupIsOpen: boolean,
    channelToUnlock: ISearch,
    users: ISearch[],
    channels: ISearch[],
    filtered: ISearch[],
    isDropdown: boolean}
    > {
    constructor(props:{handleHistory: any, changeLoc: any}) {
        super(props);
        this.state = {
            text: '',
            popupIsOpen: false,
            channelToUnlock: {id: '', name: '', isChannel: false, password: false, isClickable: false},
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
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;

    onClickPopup(chan: ISearch) {
        this.setState({ popupIsOpen: !this.state.popupIsOpen, channelToUnlock: chan });
    }
    
    closeSearchList(e: any) {
        if (this.ref.current && !this.ref.current.contains(e.target)) {
            this.setState({ isDropdown: !this.state.isDropdown });
        }
    }

    fetchUsers() { // récupération de tous les users, sauf moi-même, et les users que j'ai déjà DM
        userService.getAllUsers()
        .then(response => {
            const playload: JwtPayload = accountService.readPayload()!;
            const users = new Map<string, string>();
            response.data.forEach((user: {id: string, login: string}) => users.set(user.id, user.login)); // à revoir
            let newUserList: ISearch[] = [];
            users.forEach((login, id) => {
                if (playload.login !== login)
                    newUserList.push({id: id, name: login, isChannel: false, password: false, isClickable: true});
            })
            this.setState({users: newUserList});
            this.context.socket.emit('myDM');
            this.context.socket.on('listMyDM', (strs: {userName: string, userId: string, connected: boolean}[]) => {
                let newList: ISearch[] = [];
                for (let user of this.state.users) {
                    let ok: boolean = true;
                    for (let elt of strs) {
                        if (elt.userId == user.id)
                            ok = false;
                    }
                    if (ok)
                        newList.push(user);
                }
                this.setState({users: newList});
            })
        })
        .catch(error => {
            console.log(error);
        })
    }
    
    compileFiltered(users: ISearch[], channels: ISearch[]) {
        let newFiltered: ISearch[] = [];

        if (users.length > 0) {
            if (channels.length > 0)
                newFiltered = [ {id: '', name: "Users : ", isChannel: false, password: false, isClickable: false}, ...users,
                                {id: '', name: "Channels : ", isChannel: true, password: false, isClickable: false}, ...channels ];
            else
                newFiltered = [{id: '', name: "Users : ", isChannel: false, password: false, isClickable: false}, ...users];
        }
        else if (channels.length > 0)
            newFiltered = [{id: '', name: "Channels : ", isChannel: true, password: false, isClickable: false}, ...channels];
        else
            newFiltered = [];

        const filtered: ISearch[] = newFiltered;
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
                const filteredUsers: ISearch[] =
                this.state.users.filter((user: ISearch) =>
                    user.name.startsWith(event.target.value));
                const filteredChannels: ISearch[] =
                this.state.channels.filter((channel: ISearch) =>
                    channel.name.startsWith(event.target.value));

                const filtered = this.compileFiltered(filteredUsers, filteredChannels);
                return { filtered };
            });
        }
        else {
            this.setState(() => {
                const filtered: ISearch[] = this.compileFiltered(this.state.users, this.state.channels);
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

        this.context.socket.emit('listChannel');
        this.context.socket.on('listChannel', (strs: IChannel[]) => {
            let newChanList: {id: string, name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = [];
            for (let str of strs)
                newChanList.push({id: str.id!, name: str.name, password: str.password, isChannel: true, isClickable: true});
            this.setState({channels: newChanList});
            let newFiltered = this.compileFiltered(this.state.users, newChanList);
            this.setState({filtered: newFiltered});
        });
        
        this.context.socket.on('channelJoined', (chann: {channel: IChannel, status: string}) => {
            let nextState: ISearch[] = this.state.channels.filter(
                elt => {return (elt.id != chann.channel.id)}
                );
            this.setState({channels: nextState});
        })

        this.context.socket.on('channelLeaved', (chann: IChannel) => {
            let newChann: ISearch = {id: chann.id!, name: chann.name, password: chann.password, isChannel: true, isClickable: true};
            let nextState: ISearch[] = [...this.state.channels, newChann];
            nextState.sort((a, b) => {
                return (a.name.localeCompare(b.name))
            });
            this.setState({channels: nextState});
            let newFiltered: ISearch[] = this.compileFiltered(this.state.users, nextState);
            this.setState({filtered: newFiltered});
        })
           
        this.context.socket.on('newUserConnected', () => {
            this.fetchUsers()});
        this.context.socket.on('checkNewDM', (room: {id: string, login: string}) => { 
            let newList: ISearch[] = this.state.users.filter(
                elt => {return (elt.id != room.id)}
                );
            this.setState({users: newList});
        });

        this.context.socket.on('newLocChannel', (blop: {channel: IChannel, status: string}, array: IMessageReceived[]) => {
            let newHistory: IMessage[] = [];
            for (let elt of array) {
                newHistory.push({id: elt.date.toString(), content: elt.content, senderName: elt.senderName, senderId: elt.senderId})
            }
            this.props.handleHistory(newHistory);
            this.props.changeLoc({id: blop.channel.id, name: blop.channel.name, isChannel: true, channel: blop.channel, status: blop.status});
        }); // récupération du status ici !!

        this.context.socket.on('newLocPrivate', (id: string, login: string, messages: IMessageReceived[]) => {
            let newHistory: IMessage[] = [];
            for (let elt of messages) {
                newHistory.push({id: elt.date.toString(), content: elt.content, senderName: elt.senderName, senderId: elt.senderId})
            }
            this.props.handleHistory(newHistory);
            this.props.changeLoc({id: id, name: login, isChannel: false});
        });
    }

    componentWillUnmount(): void {
        document.removeEventListener("mousedown", this.closeSearchList);
        this.context.socket.off('listChannel');
        this.context.socket.off('listMyDM');
        this.context.socket.off("channelJoined");
        this.context.socket.off("channelLeaved");
        this.context.socket.off('newUserConnected');
        this.context.socket.off('newLocChannel');
        this.context.socket.off('newLocPrivate');
    }

    render() {
        return (
            <div id="searchbarWrapper">
                <div className="searchbar">
                    <input type="text" onChange={this.displayList} onClick={this.showSearchList} value={this.state.text} placeholder="Search"/>
                    <FontAwesomeIcon className="svgSearch" icon={faMagnifyingGlass} />
                </div>
                {(this.state.filtered.length != 0 && this.state.isDropdown) &&
                <ul ref={this.ref}>
                    {this.state.filtered.map((elt: ISearch, id: number) => (
                        <SearchElement  key={id} handleClose={this.resetFiltered}
                                        popupAction={this.onClickPopup} elt={elt} />
                    ))}
                </ul>}
                {this.state.popupIsOpen && <JoinChannelPopUp handleClose={this.onClickPopup} channelId={this.state.channelToUnlock.id} channelName={this.state.channelToUnlock.name} />}
            </div>
        )
    }
}

export default SearchChat;