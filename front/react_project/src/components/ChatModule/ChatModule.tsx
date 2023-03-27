import React from "react";
import SocketContext from "../context";
import { Socket } from 'socket.io-client'
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { Message, IDest } from "../../models";
import { CreateChannel, Popup } from "./ChatNewChannel";
import { Header, SidebarUser, SidebarChannel } from "./ChatSidebar";
import SearchChat from "./ChatSearch";
import { SendMessageForm, MessageList } from "./ChatMessages";
import '../../styles/ChatModule.scss'

class ChannelDMList extends React.Component<{socket: Socket}, {
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
            this.props.socket!.on('listMyChannels', (strs: string[]) => { 
                this.setState({ channels: strs }) });
        }
        if (this.state.dms.length === 0)
        {
            this.props.socket!.emit('myDM');
            this.props.socket!.on('listMyDM', (strs: {login: string, connected: boolean}[]) => { 
                console.log("DMs", strs);
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
            if (sorted.get(login) != undefined)
                sorted.set(login, true);
            else
                return;
            let nextState: {login: string, connected: boolean}[] = [];
            sorted.forEach( (connected, login) => nextState.push({login: login, connected: connected}));
            this.setState({dms: nextState});
        })

        this.props.socket!.on("userDisconnected", (login: string) => {
            let sorted = new Map<string, boolean>();
            for (let elt of this.state.dms) {
                sorted.set(elt.login, elt.connected);
            }
            if (sorted.get(login) != undefined)
                sorted.set(login, false);
            else
                return;
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
            <div id="channelListWrapper">
            <h2>Channels</h2>
            <ul className="channelList">
                { this.state.channels.map((channel) => { 
                   return (<li key={channel}><button onClick={() => this.changeLoc({Loc: channel, isChannel: true})}>{channel}</button></li> ) }
                )}
            </ul>
            {displayDM && (
                <React.Fragment>
                    <h2>DMs</h2>
                    <ul className="channelList">
                        { this.state.dms.map((dm, id) => { 
                           if (this.state.me.login != dm.login)
                           { return (<li key={id}><button onClick={() => this.changeLoc({Loc: dm.login, isChannel: false})}>{dm.login} {dm.connected? 'o' : null}</button></li> ) }
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
                        <div id="chat_page">
                            <div className="card">
                                {this.state.popupIsOpen && <Popup handleClose={this.onClickPopup} />}
                                <div id="chatLeft">
                                    <SearchChat socket={socket} action={this.handleHistory} action2={this.changeLoc} />
                                    <ChannelDMList socket={socket} />
                                    <CreateChannel onClick={this.onClickPopup} />
                                </div>
                                <div id="chatRight">
                                    <div className={this.state.sidebarIsOpen ? "sidebar show" : "sidebar"}>
                                    {this.state.sidebarIsOpen && (this.state.dest.isChannel ? <SidebarChannel dest={this.state.dest} handleClose={this.onClickSidebar}/> : <SidebarUser handleClose={this.onClickSidebar} dest={this.state.dest}/>)}
                                    </div>
                                    <Header dest={this.state.dest} onClick={this.onClickSidebar}/>
                                    <MessageList history={this.state.history} action={this.handleNewMessageOnHistory} socket={socket} />
                                    <SendMessageForm dest={this.state.dest} socket={socket}/>
                                </div>
                            </div>
                        </div>)}
                    }
                }
            </SocketContext.Consumer>
        )
    }
}
