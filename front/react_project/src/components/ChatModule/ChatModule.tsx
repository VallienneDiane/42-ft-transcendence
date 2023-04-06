import React from "react";
import SocketContext from "../context";
import { Socket } from 'socket.io-client'
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { Message, IDest, IChannelEntity } from "../../models";
import { CreateChannel } from "./ChatNewChannel";
import { Header, SidebarUser, SidebarChannel } from "./ChatSidebar";
import SearchChat from "./ChatSearch";
import { SendMessageForm, MessageList } from "./ChatMessages";
import '../../styles/ChatModule.scss'

class ChannelDMList extends React.Component<{socket: Socket}, {
    channels: {channel: IChannelEntity, status: string}[],
    dms: {userName: string, userId: string, connected: boolean}[], 
    me: JwtPayload}> {
    constructor(props: {socket: Socket}) {
        super(props);
        this.state = {channels: [], dms: [], me: accountService.readPayload()!};
        this.changeLoc = this.changeLoc.bind(this);
        this.initList = this.initList.bind(this);
        this.checkOnline = this.checkOnline.bind(this);
        this.checkOffline = this.checkOffline.bind(this);
    }
    
    changeLoc(channel: {loc: string, isChannel: boolean}) {
        this.props.socket.emit('changeLoc', channel);  
    }

    initList() {
        this.props.socket.emit('myChannels');
        this.props.socket.on('listMyChannels', (channels: {channel: IChannelEntity, status: string}[]) => { 
            console.log("My Channels: ", channels);
            this.setState({ channels: channels }) }); 
        this.props.socket.emit('myDM');
        this.props.socket.on('listMyDM', (strs: {userName: string, userId: string, connected: boolean}[]) => { 
            // console.log("my DM: ", strs);
            this.setState({ dms: strs }) });
    }

    checkOnline() {
        this.props.socket.on("userConnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean}>();
            for (let elt of this.state.dms) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected});
            }
            if (sorted.get(user.userId) != undefined) // vérifier si le login se trouve dans ma liste de DM
                sorted.set(user.userId, {userName: user.userLogin, connected: true});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userId: id, userName: user.userName, connected: user.connected}));
            this.setState({dms: nextState});
        })
    }

    checkOffline() {
        this.props.socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean}>();
            for (let elt of this.state.dms) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected});
            }
            if (sorted.get(user.userId) != undefined)
                sorted.set(user.userId, {userName: user.userLogin, connected: false});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userName: user.userName, userId: id, connected: user.connected}));
            this.setState({dms: nextState});
        })
    }

    componentDidMount(): void {
        this.initList();
        this.checkOnline();
        this.checkOffline();

        this.props.socket.on("leaveChannel", (channelId: string) => {
            let nextState: {channel: IChannelEntity, status: string}[] = this.state.channels.filter(
                (elt: {channel: IChannelEntity}) => {return (elt.channel.id != channelId)}
                );
            this.setState({channels: nextState});
        });
        
        this.props.socket.on('checkNewDM', (room: {id: string, login: string}, connected: boolean) => {
            let sorted = new Map<string, {userName: string, userId: string, connected: boolean}>();
            for (let elt of this.state.dms) {
                sorted.set(elt.userName, {userName: elt.userName, userId: elt.userId, connected: elt.connected});
            }
            sorted.set(room.login, {userName: room.login, userId: room.id, connected: connected});
            let nextState: {userName: string, userId: string, connected: boolean}[] = [];
            sorted.forEach( (room, login) => nextState.push({userName: login, userId: room.userId, connected: room.connected}));
            this.setState({dms: nextState});
        }); // à remplacer par sort
    }

    componentWillUnmount(): void {
        this.props.socket.off('listMyChannels');
        this.props.socket.off('listMyDM');
        this.props.socket.off("leaveChannel");
        this.props.socket.off('checkNewDM');
        this.props.socket.off("userConnected");
        this.props.socket.off("userDisconnected");
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
                   return (<li key={channel.channel.id}><button onClick={() => this.changeLoc({loc: channel.channel.id, isChannel: true})}>{channel.channel.name}</button></li> ) }
                )}
            </ul>
            {displayDM && (
                <React.Fragment>
                    <h2>DMs</h2>
                    <ul className="channelList">
                        { this.state.dms.map((dm, id) => { 
                           if (this.state.me.login != dm.userName)
                           { return (<li key={id}><button onClick={() => this.changeLoc({loc: dm.userId, isChannel: false})}>{dm.userName}</button><div className={dm.connected? "circle online" : "circle offline"}></div></li> ) }
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
    history: Message[]}> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: {id: '', name: 'general', isChannel: true}, history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.handleHistory = this.handleHistory.bind(this);
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

    render() {
        return (  
            <SocketContext.Consumer>
                { ({ socket }) => {
                    if (socket.auth.token != "undefined") {
                        return (
                        <div id="chat_page">
                            <div className="card">
                                <div id="chatLeft">
                                    <SearchChat socket={socket} action={this.handleHistory} action2={this.changeLoc} />
                                    <ChannelDMList socket={socket} />
                                    <CreateChannel />
                                </div>
                                <div id="chatRight">
                                    <Header dest={this.state.dest}/>
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
