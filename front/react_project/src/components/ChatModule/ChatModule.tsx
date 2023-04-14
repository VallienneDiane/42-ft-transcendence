import React, { ContextType } from "react";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { IMessage, IDest, IChannel } from "./Chat_models";
import { CreateChannel } from "./ChatNewChannel";
import { Header } from "./ChatSidebar";
import SearchChat from "./ChatSearch";
import { SendMessageForm, MessageList } from "./ChatMessages";
import '../../styles/ChatModule.scss'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';
import { useParams } from "react-router-dom";

class ChannelDMList extends React.Component<{}, {
    channels: {channel: IChannel, status: string}[], // le status sert juste à trier ma liste ici
    dms: {userName: string, userId: string, connected: boolean}[], 
    waitingMsg: boolean,

    me: JwtPayload}> {
    constructor(props: {}) {
        super(props);
        this.state = {
            channels: [],
            dms: [],
            waitingMsg: false,
            me: accountService.readPayload()!,
        };
        this.changeLoc = this.changeLoc.bind(this);
        this.initList = this.initList.bind(this);
        this.checkOnline = this.checkOnline.bind(this);
        this.checkOffline = this.checkOffline.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;
    
    changeLoc(channel: {loc: string, isChannel: boolean}) {
        this.context.socket.emit('changeLoc', channel);
        this.setState({ waitingMsg: false });
    }

    initList() {
        this.context.socket.emit('myChannels');
        this.context.socket.on('listMyChannels', (channels: {channel: IChannel, status: string}[]) => { 
            this.setState({ channels: channels }) }); 
        this.context.socket.emit('myDM');
        this.context.socket.on('listMyDM', (strs: {userName: string, userId: string, connected: boolean}[]) => { 
            this.setState({ dms: strs }) });
        this.context.socket.on('pingedBy', (login: string) => {
                this.setState({ waitingMsg: true });
        })
    }

    checkOnline() {
        this.context.socket.on("userConnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean}>();
            for (let elt of this.state.dms) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected});
            }
            if (sorted.get(user.userId) != undefined) // vérifier si le login se trouve dans ma liste de DM
                sorted.set(user.userId, {userName: user.userLogin, connected: true});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userName: user.userName, userId: id, connected: user.connected}));
            this.setState({dms: nextState});
        })
    }

    checkOffline() {
        this.context.socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
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
        
        this.context.socket.on('checkNewDM', (room: {id: string, login: string}, connected: boolean) => {
            let sorted = new Map<string, {userName: string, userId: string, connected: boolean}>();
            for (let elt of this.state.dms) {
                sorted.set(elt.userName, {userName: elt.userName, userId: elt.userId, connected: elt.connected});
            }
            sorted.set(room.login, {userName: room.login, userId: room.id, connected: connected});
            let nextState: {userName: string, userId: string, connected: boolean}[] = [];
            sorted.forEach( (room, login) => nextState.push({userName: login, userId: room.userId, connected: room.connected}));
            this.setState({dms: nextState});
        });

        this.context.socket.on('channelJoined', (chann: {channel: IChannel, status: string}) => {
            let nextState: {channel: IChannel, status: string}[] = [...this.state.channels, chann];
            nextState.sort((a, b) => {
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
                return (a.channel.name.localeCompare(b.channel.name))
            });
            this.setState({channels: nextState});
        })

        this.context.socket.on('channelLeaved', (chann: IChannel) => {
            let nextState: {channel: IChannel, status: string}[] = this.state.channels.filter(
                (elt: {channel: IChannel}) => {return (elt.channel.id != chann.id)}
                );
            this.setState({channels: nextState});
        })

        this.context.socket.on('channelDestroy', (channelId: string) => {
            let nextState: {channel: IChannel, status: string}[] = this.state.channels.filter(
                (elt: {channel: IChannel}) => {return (elt.channel.id != channelId)}
                );
            this.setState({channels: nextState});
        })
    }

    componentWillUnmount(): void {
        this.context.socket.off('listMyChannels');
        this.context.socket.off('listMyDM');
        this.context.socket.off('checkNewDM');
        this.context.socket.off("userConnected");
        this.context.socket.off("userDisconnected");
        this.context.socket.off("channelJoined");
        this.context.socket.off("channelLeaved");
        this.context.socket.off("channelDestroy");
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
                   return (<li key={channel.channel.id}><button onClick={() => this.changeLoc({loc: channel.channel.id!, isChannel: true})}>{channel.channel.name}</button></li> ) }
                )}
            </ul>
            {displayDM && (
                <React.Fragment>
                    <h2>DMs</h2>
                    <ul className="channelList">
                    {this.state.dms.map((dm, id) => {
                    if (this.state.me.login !== dm.userName) {
                        return (
                        <li key={id}>
                            <button onClick={() => this.changeLoc({loc: dm.userId, isChannel: false})} className={this.state.waitingMsg ? "waitingMsg" : ""}>
                                {dm.userName}
                                { this.state.waitingMsg ? <FontAwesomeIcon id="msg" icon={faCommentDots} /> : ""  }
                            </button>
                            <div className={dm.connected? "circle online" : "circle offline"}></div>
                        </li>
                        );
                    }
                    return null;
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
    history: IMessage[]}> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: {id: '', name: '', isChannel: true}, history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.handleHistory = this.handleHistory.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;
    
    componentDidMount(): void {
        if (this.context.socket != null) {
            this.context.socket.emit("whereIam");
        }
    }

    changeLoc(newDest: IDest) {
        // console.log(newDest);
        this.setState({ dest: newDest });
    }

    handleNewMessageOnHistory(newMessage: IMessage) {
        const save: IMessage[] = this.state.history!;
        save.reverse();
        save.push(newMessage);
        this.setState({
            history: save,
        });
    }

    handleHistory(newHistory: IMessage[]) {
        this.setState({ history: newHistory });
    }

    render() {
        if (this.context.socket != null) {
            return (
                <div id="chat_page">
                    <div className="card">
                         <div id="chatLeft">
                            <SearchChat handleHistory={this.handleHistory} changeLoc={this.changeLoc} />
                            <ChannelDMList />
                            <CreateChannel />
                        </div>
                        <div id="chatRight">
                            <Header dest={this.state.dest}/>
                            <MessageList history={this.state.history} handleHistory={this.handleNewMessageOnHistory} />
                            <SendMessageForm dest={this.state.dest} />
                        </div>
                    </div>
                </div>
            )
        }
    }
}
