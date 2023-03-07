import React from "react";
import { userService } from "../services/user.service";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { UserData } from "../models"
import '../styles/ChatModule.scss'
import SocketContext from "./context";
import { Socket } from 'socket.io-client'

interface IMessageEntity {
    id?: number,
    room?: string,
    isChannel?: boolean,
    sender: string,
    content: string,
    date: Date,
}

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
    history?: IMessageEntity[];
    action?: any;
    action2?: any;
    socket?: Socket,
}

interface Users {
    rooms: string[];
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

class Search extends React.Component<IChat, Message> {
    constructor(props: {}) {
        super(props);
        this.state = { text: "" };
        this.searchSmth = this.searchSmth.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    searchSmth(event: any) {
        event.preventDefault();
        if (this.state.text.length > 0) {
            this.props.socket!.emit('createChannel', this.state.text, undefined, false, false, false, false);
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
        this.props.socket!.on('messageChannel', (data: MessageChat) => {
            if (data.room == this.props.dest) {
                let pouet: Message = {text: data.content, sender: data.sender};
                console.log('message from nest : ' + data.content + ', ' + data.sender);
                this.props.action(pouet);
            }
        });
        
        this.props.socket!.on('messagePrivate', (data: MessageChat) => {
            if (data.sender == this.props.dest) {
                let pouet: Message = {text: data.content, sender: data.sender};
                this.props.action(pouet);
            }
        })

        this.props.socket!.on('selfMessage', (data: MessageChat) => {
            let pouet: Message = {text: data.content, sender: data.sender};
            this.props.action(pouet);
        })

        this.props.socket!.on('notice', (data: string) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('message');
        this.props.socket!.off('notice');
    }

    render() {
        const listItems: JSX.Element[] = this.props.history!.reverse().map(
            (message, id) => <Message key={id} text={message.content} sender={message.sender} />
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
        this.props.socket!.emit('addMessage', { room, isChannel: 0, content });
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
        this.state = {rooms: [], me: accountService.readPayload()!};
        this.changeLoc = this.changeLoc.bind(this);
        this.props.socket!.emit('listChannel');
    }

    changeLoc(channel: string) {
        this.props.socket!.emit('changeLoc', channel);  
    }
    
    componentDidMount() {
        this.props.socket!.on('listChannel', (channels: string[]) => { this.setState({ rooms: channels})});
        this.props.socket!.on('newLocChannel', (room: string, messages: IMessageEntity[]) => {
            this.props.action(room);
            this.props.action2(messages);
        })
        // userService.getAllUsers()
        // .then((response) => {
        //     this.setState({ users: response.data });
        // })
        // .catch((error) => console.log(error));
    }

    render() {
        return (
            <div className="channelListWrapper">
                <ul className="channelList">
                    { this.state.rooms.map((room) => { 
                        if (this.state.me.login !== room)
                        { return ( <li key={room} onClick={() => this.changeLoc(room)}> {room}</li> ) }
                    })}
                </ul>
            </div>
        )
    }
}

export default class ChatModule extends React.Component<{}, IChat> {
    constructor(props : {}) {
        super(props);
        this.state = {dest: 'general', history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
    }

    changeLoc(newDest: string) {
        this.setState({dest: newDest});
    }

    handleNewMessageOnHistory(newMessage: IMessageEntity) {
        this.setState({
            history: [...this.state.history!, newMessage]
        });
    }

    handleHistory(newHistory: IMessageEntity[]) {
        this.setState({ history: newHistory });
    }


    render() {
        return (  
            <SocketContext.Consumer > 
            { ({ socket }) => (
            <React.Fragment>
            <div className="chatWrapper">
                <div className="left">
                    <Search socket={socket} />
                    <ChannelList action={this.changeLoc} action2={this.handleHistory} socket={socket} />
                </div>
                <div className="chatMessageWrapper">
                    <Header dest={this.state.dest} />
                    <MessageList dest={this.state.dest} history={this.state.history} action={this.handleNewMessageOnHistory} socket={socket} />
                    <SendMessageForm dest={this.state.dest} socket={socket}/>
                </div>
            </div>
            </React.Fragment> )}
            </SocketContext.Consumer>
        )
    }
}
