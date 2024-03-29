import React, { ContextType } from "react";
import { SocketContext } from "../context";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { IMessage, IDest, IChannel, IMessageReceived } from "./Chat_models";
import { Popup } from "./ChatNewChannel";
import { Header } from "./ChatSidebar";
import SearchChat from "./ChatSearch";
import { SendMessageForm, MessageList } from "./ChatMessages";
import '../../styles/ChatModule.scss'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from '@fortawesome/free-solid-svg-icons';

class ChannelDMList extends React.Component<{ 
    dest: string, 
    privateMsgs: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] 
}, { me: JwtPayload, channels: {channel: IChannel, status: string}[], privateMsgs: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] }> {
    constructor(props: { 
        dest: string, 
        privateMsgs: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[]
    }) {
        super(props); 
        this.state = { me: accountService.readPayload()!, channels: [], privateMsgs: props.privateMsgs };
        this.changeLoc = this.changeLoc.bind(this);
        this.checkOnline = this.checkOnline.bind(this);
        this.checkOffline = this.checkOffline.bind(this);
        this.checkNewMsg = this.checkNewMsg.bind(this);
        this.setMyChannels = this.setMyChannels.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;
    
    changeLoc(channel: {loc: string, isChannel: boolean}) {
        this.context.socket.emit('changeLoc', channel);
        const index = this.state.privateMsgs.findIndex(dm => dm.userId === channel.loc);
        if (index != -1) {
            const tmpDM = [...this.state.privateMsgs];
            tmpDM[index].waitingMsg = false;
            this.setState({ privateMsgs: tmpDM });
        }
    }
    
    checkNewMsg() {
        this.context.socket.on('pingedBy', (id: string) => {
            const index = this.state.privateMsgs.findIndex(dm => dm.userId == id);
            if (index != -1) {
                const tmpDM = [...this.state.privateMsgs];
                tmpDM[index].waitingMsg = true;
                this.setState({ privateMsgs: tmpDM });
            }
        })
    }

    checkOnline() {
        this.context.socket.on("userConnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean, waitingMsg: boolean}>();
            for (let elt of this.state.privateMsgs) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected, waitingMsg: elt.waitingMsg});
            }
            const change: {userName: string, connected: boolean, waitingMsg: boolean} | undefined = sorted.get(user.userId);
            if (change != undefined) // vérifier si le login se trouve dans ma liste de DM
                sorted.set(user.userId, {userName: user.userLogin, connected: true, waitingMsg: change.waitingMsg});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userName: user.userName, userId: id, connected: user.connected, waitingMsg: user.waitingMsg}));
            this.setState({privateMsgs: nextState});
        })
    }

    checkOffline() {
        this.context.socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean, waitingMsg: boolean}>();
            for (let elt of this.state.privateMsgs) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected, waitingMsg: elt.waitingMsg});
            }
            const change: {userName: string, connected: boolean, waitingMsg: boolean} | undefined = sorted.get(user.userId);
            if (change != undefined)
                sorted.set(user.userId, {userName: user.userLogin, connected: false, waitingMsg: change.waitingMsg});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userName: user.userName, userId: id, connected: user.connected, waitingMsg: user.waitingMsg}));
            this.setState({privateMsgs: nextState});
        })
    }

    setMyChannels() {
        this.context.socket.emit('myChannels');
        this.context.socket.on('listMyChannels', (channels: {channel: IChannel, status: string}[]) => {
            let orderedList = channels;
            orderedList.sort((a, b) => {
                return a.channel.name.localeCompare(b.channel.name);
            })
            this.setState({ channels: channels }) }); 

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

    componentDidMount(): void {
        this.setMyChannels();
        // this.checkOnline();
        this.context.socket.on("userConnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean, waitingMsg: boolean}>();
            for (let elt of this.state.privateMsgs) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected, waitingMsg: elt.waitingMsg});
            }
            const change: {userName: string, connected: boolean, waitingMsg: boolean} | undefined = sorted.get(user.userId);
            if (change != undefined) // vérifier si le login se trouve dans ma liste de DM
                sorted.set(user.userId, {userName: user.userLogin, connected: true, waitingMsg: change.waitingMsg});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userName: user.userName, userId: id, connected: user.connected, waitingMsg: user.waitingMsg}));
            this.setState({privateMsgs: nextState});
        })
        // this.checkOffline();
        this.context.socket.on("userDisconnected", (user: {userId: string, userLogin: string}) => {
            let sorted = new Map<string, {userName: string, connected: boolean, waitingMsg: boolean}>();
            for (let elt of this.state.privateMsgs) {
                sorted.set(elt.userId, {userName: elt.userName, connected: elt.connected, waitingMsg: elt.waitingMsg});
            }
            const change: {userName: string, connected: boolean, waitingMsg: boolean} | undefined = sorted.get(user.userId);
            if (change != undefined)
                sorted.set(user.userId, {userName: user.userLogin, connected: false, waitingMsg: change.waitingMsg});
            else
                return;
            let nextState: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] = [];
            sorted.forEach( (user, id) => nextState.push({userName: user.userName, userId: id, connected: user.connected, waitingMsg: user.waitingMsg}));
            this.setState({privateMsgs: nextState});
        })
        this.checkNewMsg();
        
        this.context.socket.on('checkNewDM', (room: {id: string, login: string}, connected: boolean) => {
            let sorted = new Map<string, {userName: string, userId: string, connected: boolean, waitingMsg: boolean}>();
            for (let elt of this.state.privateMsgs) {
                sorted.set(elt.userName, {userName: elt.userName, userId: elt.userId, connected: elt.connected, waitingMsg: elt.waitingMsg});
            }
            const change: {userName: string, connected: boolean, waitingMsg: boolean} | undefined = sorted.get(room.login);
            if (change == undefined && room.login === this.props.dest) {
                sorted.set(room.login, {userName: room.login, userId: room.id, connected: connected, waitingMsg: false});
            }
            else if (change == undefined && room.login !== this.props.dest) {
                sorted.set(room.login, {userName: room.login, userId: room.id, connected: connected, waitingMsg: true});
            }
            let nextState: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] = [];
            sorted.forEach( (room, login) => nextState.push({userName: login, userId: room.userId, connected: room.connected, waitingMsg: room.waitingMsg}));
            this.setState({privateMsgs: nextState});
        });
    }

    componentWillUnmount(): void {
        this.context.socket.off('listMyChannels');
        this.context.socket.off("channelJoined");
        this.context.socket.off("channelLeaved");
        this.context.socket.off("channelDestroy");
        this.context.socket.off('checkNewDM');
        this.context.socket.off('pingedBy');
        this.context.socket.off("userConnected");
        this.context.socket.off("userDisconnected");
    }

    render() {
        let displayDM: boolean = false;
        if (this.state.privateMsgs.length !== 0)
            displayDM = true;
        return (
            <div id="channelListWrapper">
                <div id="channelsDiv">
                    <h2>Channels</h2>
                    <ul className="channelList">
                        { this.state.channels.map((channel) => { 
                           return (<li key={channel.channel.id}><button onClick={() => this.changeLoc({loc: channel.channel.id!, isChannel: true})}>{channel.channel.name}</button></li> ) }
                        )}
                    </ul>
                </div>
            {displayDM && <div id="DMDiv"> 
                <React.Fragment>
                    <h2>DMs</h2>
                    <ul className="channelList">
                    {this.state.privateMsgs.map((dm, id) => {
                    if (this.state.me.sub !== dm.userId) {
                        return (
                        <li key={id}>
                            <button onClick={() => this.changeLoc({loc: dm.userId, isChannel: false})} className={dm.waitingMsg ? "waitingMsg" : ""}>
                                { dm.userName }
                                { dm.waitingMsg ? <FontAwesomeIcon id="msg" icon={faCommentDots} /> : ""  }
                            </button>
                            <div className={dm.connected? "circle online" : "circle offline"}></div>
                        </li>
                        );
                    }
                    return null;
                    })}
                </ul>
                </React.Fragment>
            </div>}
        </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, {
    dest: IDest,
    history: IMessage[],
    dms: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[],
    popupIsOpen: boolean,
    show: boolean
}> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: {id: '', name: '', isChannel: true}, history: [], dms: [], popupIsOpen: false, show: false};
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.onClickPopup = this.onClickPopup.bind(this);
        this.initList = this.initList.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;
    private previousContext: any;

    onClickPopup() {
        this.setState({ popupIsOpen: !this.state.popupIsOpen});
    }

    handleNewMessageOnHistory(newMessage: IMessage) {
        let save: IMessage[] = [...this.state.history!];
        save.push(newMessage);
        this.setState({
            history: save,
        });
    }

    initList() {
        this.context.socket.on('newLocChannel', (blop: {channel: IChannel, status: string}, array: IMessageReceived[]) => {
            let newHistory: IMessage[] = [];
            for (let elt of array) {
                newHistory.push({id: elt.date.toString(), content: elt.content, senderName: elt.senderName, senderId: elt.senderId})
            }
            this.setState({ history: newHistory });
            this.setState({ dest: {id: blop.channel.id!, name: blop.channel.name, isChannel: true, channel: blop.channel, status: blop.status}});
        }); // récupération du status ici !!

        this.context.socket.on('newLocPrivate', (id: string, login: string, messages: IMessageReceived[]) => {
            let newHistory: IMessage[] = [];
            for (let elt of messages) {
                newHistory.push({id: elt.date.toString(), content: elt.content, senderName: elt.senderName, senderId: elt.senderId})
            }
            this.setState({ history: newHistory });
            this.setState({ dest: {id: id, name: login, isChannel: false}});
        });

        this.context.socket.emit('myDM');
        this.context.socket.on('listMyDM', (strs: {userName: string, userId: string, connected: boolean}[]) => {
            let listDM: {userName: string, userId: string, connected: boolean, waitingMsg: boolean}[] = [];
            strs.forEach((elt) => {
                listDM.push({userName: elt.userName, userId: elt.userId, connected: elt.connected, waitingMsg: false});
            });
            this.setState({ dms: listDM, show: true })
        });
    }

    componentDidMount() {
        this.previousContext = this.context;
        if (this.context.socket !== null) {
            this.context.socket.emit("whereIam");
            this.initList();
        }
    }

    componentDidUpdate() {
        if (this.previousContext !== this.context) {
            this.initList();
        }
        this.previousContext = this.context;
    }

    componentWillUnmount() {
        this.context.socket.off('newLocChannel');
        this.context.socket.off('newLocPrivate');
        this.context.socket.off('listMyDM');
    }

    render() {
        if (this.context.socket != null && this.state.show) {
            return (
                <div id="chat_page">
                    <div className="card">
                        {this.state.popupIsOpen && <Popup handleClose={this.onClickPopup} />}   
                         <div id="chatLeft">
                            <SearchChat privateMsgs={this.state.dms} />
                            <ChannelDMList dest={this.state.dest.name} privateMsgs={this.state.dms} />
                            <div id="createChannel">
                                <p className="btn" onClick={this.onClickPopup}>+ New Channel</p>
                            </div>
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
