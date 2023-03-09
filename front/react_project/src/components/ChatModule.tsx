import React, { useState } from "react";
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import '../styles/ChatModule.scss'
import SocketContext from "./context";
import { Socket } from 'socket.io-client'
import { useForm } from "react-hook-form";
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
    text: string;
    sender?: string;
}

interface IMessageToSend {
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
    console.log(value);
    console.log(value.sender, value.text);
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

    componentDidUpdate(): void {
        this.props.socket!.on("messageChannel", (data: IMessageToSend[]) => {
            const msg = data[0]
            console.log('message from nest : ' + msg.content + ', ' + msg.sender);
            this.props.action({text: msg.content, sender: msg.sender});
        });
        
        this.props.socket!.on('messagePrivate', (data: IMessageToSend) => {
            if (data.sender == this.props.dest!.Loc) {
                let pouet: Message = {text: data.content, sender: data.sender};
                this.props.action(pouet);
            }
        })

        this.props.socket!.on('selfMessage', (data: IMessageToSend) => {
            let pouet: Message = {text: data.content, sender: data.sender};
            console.log('selfMessage : ', pouet);
            this.props.action(pouet);
        })

        this.props.socket!.on('notice', (data: string) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('messagePrivate');
        this.props.socket!.off('notice');
        this.props.socket!.off('selfMessage');
        this.props.socket!.off('messageChannel');
    }

    render() {
        const listItems: JSX.Element[] = this.props.history!.reverse().map(
            (message, id) => <Message key={id} sender={message.sender!} text={message.text} />
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
            this.props.socket!.emit('listChannel');
            this.props.socket!.on('listChannel', (strs: string[]) => { this.setState({ channels: strs }) });
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
        this.props.socket!.off('listChannel');
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
    return (
      <div className="popupBox">
        <div className="box">
          <span className="closeIcon" onClick={props.handleClose}>x</span>
                    <b>Create New Channel</b>
                    <p>form</p>
                    <button>Create</button>
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
            <p className="btn" onClick={() => handleBtnClick()}>
            + Create New Channel
            </p>
            {btnState && <Popup
                handleClose={handleBtnClick}
            />}       
        </div>
    );
}

export default class ChatModule extends React.Component<{}, IChat> {
    constructor(props : {}) {
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
        this.setState({
            history: [...this.state.history!, newMessage]
        });
    }

    handleHistory(newHistory: Message[]) {
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
                    <CreateChannel />
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
