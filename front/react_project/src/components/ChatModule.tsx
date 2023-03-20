import React, { useState, useContext, useEffect, useRef } from "react";
import { accountService } from "../services/account.service";
import '../styles/ChatModule.scss'
import SocketContext from "./context";
import { Socket } from 'socket.io-client'
import { userService } from "../services/user.service";
import CreateChannel from "./CreateChannel"
import { Box } from '@mui/material';
import { UserData, IMessageToSend, Message, IDest, IMessageEntity, IChannel } from "../models";
import { JwtPayload } from "jsonwebtoken";

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

    const kickUser = () => {
        // search
        socket.emit('kickUser', "nami", props.dest.Loc);
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
        <div className="popupBox">
        <div className="box" ref={ref}>
          <span className="closeIcon" onClick={props.handleClose}>x</span>
          <div className="bloc1">
            <h1>{props.dest.Loc}</h1>
            <div className="blocMemberList">
                <h2>Members</h2>
                <ul className="memberList">{members.map((member) => {return (
                    <li>{member}</li>
                )})}
                </ul>
            </div>
            <div className="bloc2">
                {props.dest.channel?.inviteOnly ? (
                <button onClick={inviteUser}>Invite</button>
                ) : null}
                {props.dest.isOp ? (
                <button onClick={kickUser}>Kick</button>
                ) : null}
            </div>
          </div>
            <button onClick={leaveChannel}>Leave</button>
        </div>
      </div>
    )
}

function ParamsDM(props: {handleClose: any}) {
    const {socket} = useContext(SocketContext);
    const ref = useRef<HTMLDivElement>(null);

    const addFriend = () => {

    }

    const block = () => {

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
        <div className="dropdown" ref={ref}>
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
                    <button onClick={block}>Block</button>
                </li>
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
            <h1>{props.dest.Loc}</h1>
            {props.dest.Loc !== "general" && <button className="gear" onClick={onClick}>+</button>}
            {isOpen && (isChannel ? <ParamsChannel dest={props.dest} handleClose={onClick}/> : <ParamsDM handleClose={onClick} />)}
        </div>
    )
}

class JoinChannelPopUp extends React.Component<{socket: Socket, open: boolean, closeAction: any, channelName: string}, {pass: string}> {
    constructor(props: {socket: Socket, open: boolean, closeAction: any, channelName: string}) {
        super(props);
        this.state = {
            pass: ''
        }
        this.closeButton = this.closeButton.bind(this);
        this.handlePass = this.handlePass.bind(this);
        this.handlerJoinPass = this.handlerJoinPass.bind(this);
    }

    closeButton(event: any) {
        this.props.closeAction();
    }

    handlePass(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ pass: event.target.value });
    }

    handlerJoinPass(event: any) {
        event.preventDefault();
        this.props.socket!.emit('joinChannel', {channelName: this.props.channelName, channelPass: this.state.pass});
        this.setState({ pass: '' });
        this.props.closeAction();
    }

    render() {
        return (
            <div>
                {this.props.open &&
                    <Box>
                        <button onClick={this.closeButton}>X</button>
                        <form className="sendJoinWithPass" onSubmit={this.handlerJoinPass}>
                        <input type="textarea" className="inputPass" placeholder="Enter channel pass here..." value={this.state.pass} onChange={this.handlePass} />
                        <input type="submit" value="Send" />
                </form>
                    </Box>}
            </div>
        )
    }
}

class SearchElement extends React.Component<{socket: Socket, popupAction: any, reset: any, name: string, isChannel: boolean, password: boolean, isClickable: boolean}, {openPopup: boolean}> {
    constructor(props: {socket: Socket, popupAction: any, reset: any, name: string, isChannel: boolean, password: boolean, isClickable: boolean}) {
        super(props);
        this.onClickChatting = this.onClickChatting.bind(this);
        this.handlerJoinChannel = this.handlerJoinChannel.bind(this);
    }

    handlerJoinChannel() {
        if (!this.props.password) {
            this.props.socket!.emit('joinChannel', {channelName: this.props.name, channelPass: null});
            this.props.reset();
        }
        else {
            this.props.popupAction(this.props.name);
        }
    }

    onClickChatting() {
        this.props.socket!.emit('changeLoc', {Loc: this.props.name, isChannel: false});
        this.props.reset();
    }

    render() {
        return(
        <li className="searchElement">
            {this.props.isClickable && this.props.isChannel
                && <button className="buttonJoinChannel" onClick={this.handlerJoinChannel}>{this.props.name}</button>}
            {this.props.isClickable && !this.props.isChannel
                && <button className="buttonUserChat" onClick={this.onClickChatting}>{this.props.name}</button>}
            {!this.props.isClickable && <p>{this.props.name}</p>}
        </li>);
    }
}

class SearchChat extends React.Component<{action: any, action2: any, socket: Socket}, {
    text: string,
    openPopupEnterPass: boolean,
    channelToUnlock: string,
    users: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[],
    channels: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[],
    filtered: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[]}
    > {
    constructor(props:{action: any, action2: any, socket: Socket}) {
        super(props);
        this.state = {
            text: '',
            openPopupEnterPass: false,
            channelToUnlock: '',
            users: [],
            channels: [],
            filtered: [],
        }
        this.fetchChannels = this.fetchChannels.bind(this);
        this.fetchUsers = this.fetchUsers.bind(this);
        this.displayList = this.displayList.bind(this);
        this.resetFiltered = this.resetFiltered.bind(this);
        this.handlerOpenPassPopup = this.handlerOpenPassPopup.bind(this);
        this.handlerClosePassPopup = this.handlerClosePassPopup.bind(this);
    }

    handlerOpenPassPopup(chanName: string) {
        this.setState({ 
            text: '',
            openPopupEnterPass: true,
            channelToUnlock: chanName,
            filtered: []});
    }

    handlerClosePassPopup() {
        this.setState({
            openPopupEnterPass: false,
            channelToUnlock: ''
        });
    }

    fetchChannels() {
        this.props.socket!.emit('listChannel');
    }

    fetchUsers() {
        userService.getAllUsers()
        .then(response => {
            const playload: JwtPayload = accountService.readPayload()!;
            const users = response.data.map((user: UserData) => user.login);
            let newUserList: {name:string, isChannel:boolean, password: boolean, isClickable: boolean}[] = [];
            users.forEach((user: string) => {
                if (playload.login !== user)
                    newUserList.push({name: user, isChannel: false, password: false, isClickable: true});
            })
            this.setState({users: newUserList});
        })
        .catch(error => {
            console.log(error);
        })
    }

    componentDidMount(): void {
        this.props.socket!.on('listChannel', (strs: {channelName: string, password: boolean}[]) => {
            let newChanList: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = [];
            for (let str of strs)
                newChanList.push({name: str.channelName, password: str.password, isChannel: true, isClickable: true});
            this.setState({channels: newChanList})});
        this.props.socket!.on('newUserConnected', () => {
            this.fetchUsers()});
        this.fetchChannels();
        this.fetchUsers();

        this.props.socket!.on('newLocChannel', (channel: IChannel, isOp: boolean, chanHistory: IMessageEntity[]) => {
            console.log('socket ON ', channel, isOp, chanHistory);
            console.log(channel.name, channel.onlyOpCanTalk);
            let newHistory: Message[] = [];
            for (let elt of chanHistory) {
                newHistory.push({id: elt.date.toString(), text: elt.content, sender: elt.sender})
            }
            this.props.action(newHistory);
            this.props.action2({Loc: channel.name, isChannel: true, channel: channel, isOp: isOp});
        })

        this.props.socket!.on('newLocPrivate', (userName: string, chanHistory: IMessageEntity[]) => {
            console.log('socket ON newLocPrivate', userName, chanHistory);
            let newHistory: Message[] = [];
            for (let elt of chanHistory) {
                newHistory.push({id: elt.date.toString(), text: elt.content, sender: elt.sender})
            }
            this.props.action(newHistory);
            this.props.action2({Loc: userName, isChannel: false});
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('listChannel');
        this.props.socket!.off('newUserConnected');
        this.props.socket!.off('newLocChannel');
        this.props.socket!.off('newLocPrivate');
    }

    displayList(event: any) { //Ceci est un frigo
        this.setState({text: event.target.value});
        if (event.target.value) {
            this.setState(() => {
                const filteredUsers: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] =
                this.state.users.filter((user: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}) =>
                    user.name.startsWith(event.target.value));
                const filteredChannels: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] =
                this.state.channels.filter((channel: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}) =>
                    channel.name.startsWith(event.target.value));
                let toReturn: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = [];
                if (filteredUsers.length > 0) {
                    if (filteredChannels.length > 0)
                        toReturn = [{name: "Users : ", isChannel: false, password: false, isClickable: false},
                        ...filteredUsers, {name: "Channels : ",
                        isChannel: true, password: false, isClickable: false},
                        ...filteredChannels];
                    else
                        toReturn = [{name: "Users : ", isChannel: false, password: false, isClickable: false}, ...filteredUsers];
                }
                else if (filteredChannels.length > 0)
                    toReturn = [{name: "Channels : ", isChannel: true, password: false, isClickable: false}, ...filteredChannels];
                else
                    toReturn = [];
                const filtered: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}[] = toReturn;
                return { filtered };
            });
        }
        else {
            this.setState({filtered: []});
        }
    }

    resetFiltered() {
        this.setState({text: '', filtered: []});
    }
    
    render() {
        return (
            <div id="searchBar">
                <form action="">
                    <input type="text" onChange={this.displayList} onClick={this.displayList} value={this.state.text} placeholder="Search"/>
                </form>
                {this.state.filtered.length != 0 && <ul>
                    {this.state.filtered.map((user: {name: string, isChannel: boolean, password: boolean, isClickable: boolean}, id: number) => (
                        <SearchElement  key={id} socket={this.props.socket!} reset={this.resetFiltered}
                                        popupAction={this.handlerOpenPassPopup} name={user.name} isChannel={user.isChannel}
                                        password={user.password} isClickable={user.isClickable} />
                    ))}
                </ul>}
                <JoinChannelPopUp socket={this.props.socket!} open={this.state.openPopupEnterPass}
                    closeAction={this.handlerClosePassPopup} channelName={this.state.channelToUnlock} />
            </div>
        )
    }
}

class ChannelList extends React.Component<{socket: Socket}, {
    channels: string[],
    dms: {login: string, connected: boolean}[],
    me: JwtPayload}> {
    constructor(props: {socket: Socket}) {
        super(props);
        this.state = {channels: [], dms: [], me: accountService.readPayload()!};
        this.changeLoc = this.changeLoc.bind(this);
    }
    
    changeLoc(channel: IDest) {
        this.props.socket!.emit('changeLoc', channel);  
    }

    componentDidMount(): void {
        if (this.state.channels.length === 0)
        {
            this.props.socket!.emit('myChannels');
            this.props.socket!.on('listMyChannels', (strs: string[]) => { this.setState({ channels: strs }) });
        }
        if (this.state.dms.length === 0)
        {
            this.props.socket!.emit('myDM');
            this.props.socket!.on('listMyDM', (strs: {login: string, connected: boolean}[]) => { 
                console.log("DM", strs);
                this.setState({ dms: strs }) });
        }

        this.props.socket!.on('checkNewDM', (login: string, connected: boolean) => {
            let sorted = new Map<string, boolean>();
            for (let elt of this.state.dms) {
                sorted.set(elt.login, elt.connected);
            }
            sorted.set(login, connected);
            let nextState: {login: string, connected: boolean}[] = [];
            sorted.forEach( (connected, login) => nextState.push({login: login, connected: connected}));
            this.setState({dms: nextState});
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('listMyChannels');
        this.props.socket!.off('listMyDM');
        this.props.socket!.off('checkNewDM');
    }

    render() {
        let displayDM: boolean = false;
        if (this.state.dms.length !== 0)
            displayDM = true;

        return (
            <div className="channelListWrapper">
            <h2>Channels</h2>
            <ul className="channelList">
                { this.state.channels.map((channel) => { 
                   return (<li key={channel} onClick={() => this.changeLoc({Loc: channel, isChannel: true})}> {channel}</li> ) }
                )}
            </ul>
            {displayDM && (
                <React.Fragment>
                    <h2>DMs</h2>
                    <ul className="channelList">
                        { this.state.dms.map((dm, id) => { 
                            if (this.state.me.login != dm.login)
                            { return (<li key={id} onClick={() => this.changeLoc({Loc: dm.login, isChannel: false})}> {dm.login} {dm.connected? 'o' : ''}</li> ) }
                        })}
                    </ul>
                </React.Fragment>
            )}
        </div>
        )
    }
}

function MessageDisplay(value: {sender: string, text: string}): JSX.Element {
    const [me, setMe] = useState<boolean>(false);
    const playload: JwtPayload = accountService.readPayload()!;

    useEffect(() => {
    if (playload.login === value.sender) {
        setMe(true);
    }}, )

    return (
        <div className={me ? "bubble sent" : "bubble received"}>
            <div className="messageUserName">{value.sender}</div>
            <div className="messageText">{value.text}</div>
        </div>
    )
}

class MessageList extends React.Component<{history: Message[], action: any, socket: Socket}, {}> {
    constructor(props: {history: Message[], action: any, socket: Socket}) {
        super(props);
    }

    componentDidMount(): void {
        this.props.socket!.on("newMessage", (data: IMessageToSend) => {
            console.log('message from nest newMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        });

        this.props.socket!.on('selfMessage', (data: IMessageToSend) => {
            console.log('message from nest selfMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        })

        this.props.socket!.on('notice', (data: string) => {
            console.log(data);
            let date = new Date();
            this.props.action({id: date.toString(), text: data, sender: "Message from server :"});
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newMessage');
        this.props.socket!.off('notice');
        this.props.socket!.off('selfMessage')
    }

    render() {
        const tmpList: Message[] = this.props.history!;
        const listItems: JSX.Element[] = tmpList.reverse().map(
            (message) => <MessageDisplay key={message.id} sender={message.sender!} text={message.text} />
        );
        return (
            <div className="messageList">
                {listItems}
            </div>
        );
    }
}

class SendMessageForm extends React.Component<{dest: IDest, socket: Socket}, {text: string}> {
    constructor(props: {dest: IDest, socket: Socket}) {
        super(props);
        this.state = { text: '' };
        this.handleMessage = this.handleMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }

    handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ text: event.target.value });
    }

    sendMessage(event: any) {
        event.preventDefault();
        let content: string = this.state.text;
        let room: string = this.props.dest!.Loc;
        let isChannel: boolean = this.props.dest!.isChannel;
        this.props.socket!.emit('addMessage', content);
        this.setState({ text: '' });
    }

    render() {
        return (
            <div className="sendMessage">
                <form className="sendMessageForm" onSubmit={this.sendMessage}>
                    <input type="textarea" className="inputMessage" placeholder="Type your message..." value={this.state.text} onChange={this.handleMessage} />
                    <input type="submit" value="Send" />
                </form>
            </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, {dest: IDest, history: Message[]}> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: {Loc: 'general', isChannel: true}, history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.handleHistory = this.handleHistory.bind(this);
    }
    
    changeLoc(newDest: IDest) {
        console.log(newDest)
        this.setState({dest: newDest});
    }

    handleNewMessageOnHistory(newMessage: Message) {
        const save: Message[] = this.state.history!;
        save.reverse();
        save.push(newMessage);
        this.setState({
            history: save,
        });
    }

    handleHistory(newHistory: Message[]) {
        this.setState({ history: newHistory });
    }

    render() {
        return (  
            <SocketContext.Consumer>
                { ({ socket }) => {
                    if (socket.auth.token != "undefined") {
                        return (
                        <div className="chatWrapper">
                            <div className="left">
                                <div className="leftHeader">
                                    <SearchChat socket={socket} action={this.handleHistory} action2={this.changeLoc} />
                                    <CreateChannel />
                                </div>
                                <ChannelList socket={socket} />
                            </div>
                            <div className="chatMessageWrapper">
                                <Header dest={this.state.dest} />
                                <MessageList history={this.state.history} action={this.handleNewMessageOnHistory} socket={socket} />
                                <SendMessageForm dest={this.state.dest} socket={socket}/>
                            </div>
                        </div>)}
                    }
                }
            </SocketContext.Consumer>
        )
    }
}
