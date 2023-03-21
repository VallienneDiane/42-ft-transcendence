import React from "react";
import SocketContext from "../context";
import { Socket } from 'socket.io-client'
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { userService } from "../../services/user.service";
import { UserData, Message, IDest, IMessageEntity, IChannel } from "../../models";
import { CreateChannel, Popup } from "./ChatNewChannel";
import { Header, SidebarUser, SidebarChannel } from "./ChatSidebar";
import { SendMessageForm, MessageList } from "./ChatMessages";
import '../../styles/ChatModule.scss'
import { Box } from '@mui/material';

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
                {/* <svg className="searchIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/></svg> */}
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
    dms: {login: string, connected: boolean}[]}> {
    constructor(props: {socket: Socket}) {
        super(props);
        this.state = {channels: [], dms: []};
        this.changeLoc = this.changeLoc.bind(this);
    }
    
    changeLoc(channel: IDest) {
        this.props.socket!.emit('changeLoc', channel);  
    }

    componentDidMount(): void {
        if (this.state.channels.length === 0)
        {
            this.props.socket!.emit('myChannels');
            this.props.socket!.on('listMyChannels', (strs: string[]) => { 
                console.log("new chann list : " , strs);
                this.setState({ channels: strs }) });
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
        });

        this.props.socket!.on("userConnected", (login: string) => {
            let sorted = new Map<string, boolean>();
            for (let elt of this.state.dms) {
                sorted.set(elt.login, elt.connected);
            }
            sorted.set(login, true);
            let nextState: {login: string, connected: boolean}[] = [];
            sorted.forEach( (connected, login) => nextState.push({login: login, connected: connected}));
            this.setState({dms: nextState});
        })

        this.props.socket!.on("userDisconnected", (login: string) => {
            let sorted = new Map<string, boolean>();
            for (let elt of this.state.dms) {
                sorted.set(elt.login, elt.connected);
            }
            sorted.set(login, false);
            let nextState: {login: string, connected: boolean}[] = [];
            sorted.forEach( (connected, login) => nextState.push({login: login, connected: connected}));
            this.setState({dms: nextState});
        })

        this.props.socket!.on("leaveChannel", (channel: string) => {
            let sorted = new Set<string>();
            for (let elt of this.state.channels)
                sorted.add(elt);
            sorted.delete(channel);
            let nextState: string[] = [];
            sorted.forEach( (chan) => nextState.push(chan));
            this.setState({channels: nextState});
        });
    }

    componentWillUnmount(): void {
        this.props.socket!.off('listMyChannels');
        this.props.socket!.off('listMyDM');
        this.props.socket!.off('checkNewDM');
        this.props.socket!.off("leaveChannel");
        this.props.socket!.off("userConnected");
        this.props.socket!.off("userDisconnected");
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
                           return (<li key={id} onClick={() => this.changeLoc({Loc: dm.login, isChannel: false})}> {dm.login} {dm.connected? 'o' : null}</li> )
                        })}
                    </ul>
                </React.Fragment>
            )}
        </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, {
    dest: IDest,
    history: Message[],
    sidebarIsOpen: boolean,
    popupIsOpen: boolean}> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: {Loc: 'general', isChannel: true}, history: [], sidebarIsOpen: false, popupIsOpen: false};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.handleHistory = this.handleHistory.bind(this);
        this.onClickSidebar = this.onClickSidebar.bind(this);
        this.onClickPopup = this.onClickPopup.bind(this);
    }
    
    changeLoc(newDest: IDest) {
        console.log(newDest)
        this.setState({ dest: newDest });
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

    onClickSidebar() {
        this.setState({ sidebarIsOpen: !this.state.sidebarIsOpen });
    }

    onClickPopup() {
        this.setState({ popupIsOpen: !this.state.popupIsOpen });
    }

    render() {
        return (  
            <SocketContext.Consumer>
                { ({ socket }) => {
                    if (socket.auth.token != "undefined") {
                        return (
                        <div className="chatWrapper">
                            {this.state.popupIsOpen && <Popup handleClose={this.onClickPopup} />}
                            <div className="left">
                                <div className="leftHeader">
                                    <SearchChat socket={socket} action={this.handleHistory} action2={this.changeLoc} />
                                    <CreateChannel onClick={this.onClickPopup} />
                                </div>
                                <ChannelList socket={socket} />
                            </div>
                            <div className="chatMessageWrapper">
                                <div className={this.state.sidebarIsOpen ? "sidebar show" : "sidebar"}>
                                {this.state.sidebarIsOpen && (this.state.dest.isChannel ? <SidebarChannel dest={this.state.dest} handleClose={this.onClickSidebar}/> : <SidebarUser handleClose={this.onClickSidebar} dest={this.state.dest}/>)}
                                </div>
                                <Header dest={this.state.dest} onClick={this.onClickSidebar}/>
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
