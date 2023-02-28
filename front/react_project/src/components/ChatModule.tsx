import React from "react";
import io from 'socket.io-client';
import { userService } from "../services/user.service";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { UserData } from "../models"
import '../styles/ChatModule.scss'

const token: any = localStorage.getItem('token');
let socket: any = null;
if (typeof token === 'string' && token.length > 0) {
    socket = io('127.0.0.1:3000', {
        transports : ['websocket'], 
        extraHeaders : {
            Authorization: `Bearer ${token}` }
    });
    socket.connect();
}

const channels: string[] = [ "general", "events", "meme" ];

interface Message {
    text: string;
    sender?: string;
}

interface MessageChat {
    sender?: string;
    room: string;
    content: string;
}

interface IChat {
    dest?: string;
    history?: Message[];
    action?: any;
}

interface Users {
    users: UserData[];
    me: JwtPayload;
}

function Header(title: IChat) {
    let location: string;
    if (title.dest![0] == '_') {
        location = 'Welcome to channel ' + title.dest!.substring(1);
    }
    else {
        location = 'Current discussion with ' + title.dest;
    }
    return (
        <div className="chatMessageHeader">
            <h1>{location}</h1>
        </div>
    )
}

function matchChannel(channel: string) {
    console.log(channel);
}

class Search extends React.Component<{}, Message> {
    constructor(props: {}) {
        super(props);
        this.state = { text: "" };
        this.searchSmth = this.searchSmth.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    searchSmth(event: any) {
        event.preventDefault();
        if (this.state.text.length > 0) {
            return channels.forEach((channel, index) => {
            if (channel === this.state.text) {
                matchChannel(this.state.text);
            }});
        }
        this.setState({ text: "" });
    }

    handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ text: event.target.value });
    }

    render() {
        const text: string = this.state.text;
        return (
            <div>
                <form className="chatSearchHeader" onSubmit={this.searchSmth}>
                    <i className="fa fa-search" aria-hidden="true"></i>
                    <input type="textarea" className="searchBar" placeholder="Search" value={text} onChange={this.handleMessage} />
                    <input type="submit" className="searchButton" value="👆" />
                </form>
            </div>
        )
    }
}

function Message(value: Message): JSX.Element {
    return (
        <div className="message">
            <div className="messageUserName">{value.sender}</div>
            <div className="bubble">{value.text}</div>
        </div>
    )
}

class MessageList extends React.Component<IChat, {}> {
    constructor(props: IChat) {
        super(props);
    }

    componentDidMount(): void {
        socket.on('message', (data: MessageChat) => {
            if (data.room == this.props.dest) {
                let pouet: Message = {text: data.content, sender: data.sender};
                console.log('message from nest : ' + data.content + ', ' + data.sender);
                this.props.action(pouet);
            }
        });
        
        socket.on('notice', (data: string) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        socket.off('message');
        socket.off('notice');
    }

    render() {
        const listItems: JSX.Element[] = this.props.history!.reverse().map(
            (message, id) => <Message key={id} text={message.text} sender={message.sender} />
        );
        return (
            <div className="messageList">
                {listItems}
            </div>
        );
    }
}


class SendMessageForm extends React.Component<IChat, Message> {
    constructor(props: IChat) {
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
        let room: string = this.props.dest!;
        // socket.emit('chat', 'send', this.props.dest, this.state.text);
        // verifier que le user existe ?
        socket.emit('privateMessage', { room, content });
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

class ChannelList extends React.Component<IChat, Users> {
    constructor(props: IChat) {
        super(props);
        this.state = {users: [], me: accountService.readPayload()};
        this.changeChann = this.changeChann.bind(this);
        }

    changeChann(channel: string) {
        this.props.action(channel);
    }

    componentDidMount() {
        userService.getAllUsers()
        .then((response) => {
            this.setState({ users: response.data });
        })
        .catch((error) => console.log(error));
    }

    render() {
        return (
            <div className="channelListWrapper">
                <ul className="channelList">
                    <li>general</li>
                    <li>events</li>
                    <li>meme</li>
                    { this.state.users.map((user) => { 
                        if (this.state.me.login !== user.login)
                        { return ( <li key={user.id} onClick={() => this.changeChann(user.login)}> {user.login}</li> ) }
                    })}
                </ul>
            </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, IChat> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: '_general', history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
    }

    changeLoc(newDest: string) {
        this.setState({dest: newDest});
        this.setState({history: []});
    }

    handleNewMessageOnHistory(newMessage: Message) {
        this.setState({
            history: [...this.state.history!, newMessage]
        });
    }

    render() {
        return (
            <div className="chatWrapper">
                <div className="left">
                    <Search />
                    <ChannelList action={this.changeLoc}/>
                </div>
                <div className="chatMessageWrapper">
                    <Header dest={this.state.dest} />
                    <MessageList dest={this.state.dest} history={this.state.history} action={this.handleNewMessageOnHistory} />
                    <SendMessageForm dest={this.state.dest} />
                </div>
            </div>
        )
    }
}
