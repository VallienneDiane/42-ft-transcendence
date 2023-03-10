import React, { useState } from "react";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import '../styles/ChatModule.scss'
import SocketContext from "./context";
import { Socket } from 'socket.io-client'
import { userService } from "../services/user.service";
import { useForm } from "react-hook-form";
import { NewChannel } from "../models";
import { StringOptionsWithImporter } from "sass";

interface IMessageEntity {
    id?: number,
    room?: string,
    isChannel?: boolean,
    sender: string,
    content: string,
    date: Date,
}

interface Message {
    id: string,
    text: string;
    sender?: string;
}

interface IMessageToSend {
    date: Date;
    sender: string;
    room: string;
    content: string;
}

interface IDest {
    Loc: string;
    isChannel: boolean;
};

interface IChat {
    dest?: IDest;
    history?: Message[];
    action?: any;
    action2?: any;
    socket?: Socket,
}

interface Users {
    channels: string[];
    me: JwtPayload;
}

interface UserData { 
    id?: number,
    login: string,
    email: string,
    password: string
}

function Header(title: IChat) {
    let location: string;
    if (title.dest!.isChannel) {
        location = 'Welcome to channel ' + title.dest!.Loc;
    }
    else {
        location = 'Current discussion with ' + title.dest!.Loc;
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

class SearchChat extends React.Component<IChat, {text: string, users: string[], channels: string[], filtered: string[]}> {
    constructor(props: IChat) {
        super(props);
        this.state = {
            text: '',
            users: [],
            channels: [],
            filtered: [],
        }
        this.fetchChannels = this.fetchChannels.bind(this);
        this.onHover = this.onHover.bind(this);
        this.displayList = this.displayList.bind(this);
    }

    fetchChannels() {
        if (this.state.channels.length === 0) {
            this.props.socket!.emit('listChannel');
            this.props.socket!.on('listChannel', (strs: string[]) => {this.setState({channels: strs})});
        }
    }

    componentDidMount(): void {
        this.fetchChannels();
        userService.getAllUsers()
        .then(response => {
            const users = response.data.map((user: UserData) => user.login);
            users.sort();
            this.setState({users: users});
            // console.log("Users", users)
        })
        .catch(error => {
            console.log(error);
        })
    }

    componentDidUpdate() {
        this.fetchChannels();
    }

    componentWillUnmount(): void {
        this.props.socket!.off('listChannel');
    }

    displayList(event: any) {
        this.setState({text: event.target.value});
        if (event.target.value) {
            this.setState((prevState) => {
                const filteredUsers = this.state.users.filter((user: string) => user.startsWith(event.target.value));
                const filteredChannels = this.state.channels.filter((channel: string) => channel.startsWith(event.target.value));
                const filtered = [...filteredUsers, ...filteredChannels];
                return { filtered };
              });
        }
        else {
            this.setState({filtered: []});
        }
    }
    
    onHover(event: any) {
        this.setState({text: event.target.innerHTML});
    }
    
    onClick(event: any) {
        // navigate("/profile/" + event.target.innerHTML);
    }
    
    render() {
        return (
            <div id="searchBar">
                <form action="">
                    <input type="text" onChange={this.displayList} onClick={this.displayList} value={this.state.text} placeholder="Search"/>
                </form>
                <ul>
                    {this.state.filtered.map((user: string) => (
                        <li key={user} onMouseEnter={this.onHover} onClick={this.onClick}>{user}</li>
                    ))}
                </ul>
            </div>
        )
    }
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
            this.props.socket!.emit('createChannel', {channelName: this.state.text, channelPass: undefined, inviteOnly: false, persistant: false, onlyOpCanTalk: false, hidden: false});
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

function Message(value: {sender: string, text: string}): JSX.Element {
    // console.log(value);
    // console.log(value.sender, value.text);
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
        this.props.socket!.on("newMessage", (data: IMessageToSend[]) => {
            const msg = data[0];
            console.log(msg);
            console.log('message from nest : ' + msg.content + ', ' + msg.sender);
            this.props.action({id: msg.date.toString(), text: msg.content, sender: msg.sender});
        });

        this.props.socket!.on('selfMessage', (data: IMessageToSend[]) => {
            const msg = data[0]
            console.log('message from nest : ' + msg.content + ', ' + msg.sender);
            this.props.action({id: msg.date.toString(), text: msg.content, sender: msg.sender});
        })

        this.props.socket!.on('notice', (data: string) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newMessage');
        this.props.socket!.off('notice');
        this.props.socket!.off('selfMessage')
    }

    render() {
        const reverseList: Message[] = this.props.history!.reverse();
        const listItems: JSX.Element[] = reverseList.map(
            (message) => <Message key={message.id} sender={message.sender!} text={message.text} />
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
        let room: string = this.props.dest!.Loc;
        let isChannel: boolean = this.props.dest!.isChannel;
        this.props.socket!.emit('addMessage', { room, isChannel: isChannel, content });
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
        this.state = {channels: [], me: accountService.readPayload()!};
        this.changeLoc = this.changeLoc.bind(this);
        this.fetchChannels = this.fetchChannels.bind(this);
    }

    fetchChannels() {
        if (this.state.channels.length === 0)
        {
            this.props.socket!.emit('myChannels');
            this.props.socket!.on('listMyChannels', (strs: string[]) => { this.setState({ channels: strs }) });
        }
    }
    
    changeLoc(channel: IDest) {
        this.props.socket!.emit('changeLoc', channel);  
        this.props.socket!.on('newLocChannel', (room: string, messages: IMessageEntity[]) => {
            console.log(room)
            this.props.action({Loc: room, isChannel: true});
            this.props.action2(messages);
        })
    }

    componentDidMount(): void {
        this.fetchChannels();
        // userService.getAllUsers()
        // .then((response) => {
            //     this.setState({ users: response.data });
            // })
            // .catch((error) => console.log(error));
    }

    componentDidUpdate() {
        this.fetchChannels();
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newLocChannel');
        this.props.socket!.off('listMyChannels');
    }

    render() {
        return (
            <div className="channelListWrapper">
            <h2>Channels</h2>
            <ul className="channelList">
                { this.state.channels.map((channel) => { 
                    if (this.state.me.login !== channel)
                    { return (<li key={channel} onClick={() => this.changeLoc({Loc: channel, isChannel: true})}> {channel}</li> ) }
                })}
            </ul>
            <h2>DMs</h2>
        </div>
        )
    }
}

const Popup = (props: any) => {
    const { register, handleSubmit } = useForm<NewChannel>();

    const onSubmit = (data: NewChannel) => {
        this.props.socket.emit('createChannel');
      }; 

    return (
      <div className="popupBox">
        <div className="box">
          <span className="closeIcon" onClick={props.handleClose}>x</span>
            <b>Create New Channel</b>
            <form onSubmit={handleSubmit(onSubmit)}>
                <label>Channel Name</label>
                <input
                {...register("channelName", {
                    required: true,
                    maxLength: 20,
                    pattern: /^[A-Za-z]+$/i
                  })} />
            <input type="submit"/>
            </form>
        </div>
      </div>
    );
  };

function CreateChannel() {
    const [btnState, setBtnState] = useState<boolean>(false);

    const handleBtnClick = () => {
        setBtnState(!btnState);
    };

    return (
        <div className="createChannel">
            <p className="btn" onClick={() => handleBtnClick()}>+</p>
            {btnState && <Popup
                handleClose={handleBtnClick}
            />}       
        </div>
    );
}

export default class ChatModule extends React.Component<{ socket: Socket }, IChat> {
    constructor(props : { socket: Socket }) {
        super(props);
        this.state = {dest: {Loc: 'general', isChannel: true}, history: []};
        this.changeLoc = this.changeLoc.bind(this);
        this.handleNewMessageOnHistory = this.handleNewMessageOnHistory.bind(this);
        this.handleHistory = this.handleHistory.bind(this);
    }
    
    changeLoc(newDest: IDest) {
        this.setState({dest: newDest});
    }

    handleNewMessageOnHistory(newMessage: Message) {
        const save: Message[] = this.state.history!;
        save.push(newMessage);
        this.setState({
            history: save,
        });
    }

    handleHistory(newHistory: Message[]) {
        this.setState({ history: newHistory });
    }

    render() {
        if (this.props.socket.auth.token != "undefined") {
            return (  
                <SocketContext.Consumer > 
                { ({ socket }) => (
                <React.Fragment>
                <div className="chatWrapper">
                    <div className="left">
                        <div className="leftHeader">
                            <SearchChat socket={socket}/>
                            <CreateChannel />
                        </div>
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
            )}
    }
}
