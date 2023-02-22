import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';
import './ChatModule.css'

const socket = socketIOClient("127.0.0.1:3000", {transports : ['websocket']})

interface Message {
    text: string;
    senderName?: string;
}

interface IChat {
    dest?: string;
    history?: Message[];
    action?: any;
}

function ListMessage(value: Message): JSX.Element {
    return (
        <div className="message">
            <div className="messageUserName">{value.senderName}</div>
            <div className="bubble">{value.text}</div>
        </div>
    )
}

class MessageList extends React.Component<IChat, {}> {
    constructor(props: IChat) {
        super(props);
    }

    componentDidMount(): void {
        socket.on('newMessage', (...data: string[]) => {
            if (data[0] == this.props.dest) {
                console.log('message from nest : ' + data);
                var pouet: Message = {text : data[2], senderName: data[1]};
                this.props.action(pouet);
            }
        });
        
        socket.on('notice', (data: string) => {
            console.log(data);
        })
    }

    componentWillUnmount(): void {
        socket.off('newMessage');
    }

    render() {
        const listItems: JSX.Element[] = this.props.history!.reverse().map(
            (message, id) => <ListMessage key={id} text={message.text} senderName={message.senderName} />
        );
        return (
            <div className="messageList">
                {listItems}
            </div>
        );
    }
}

function Header(title: IChat) {
    let location: string;
    console.log(title);
    if (title.dest![0] == '_') {
        location = 'Welcome to channel ' + title.dest!.substring(1);
    }
    else {
        location = 'Current discussion with ' + title.dest;
    }
    return (
        <div className="chatMessageHeader">
            <h1>{location}</h1>
            First test
        </div>
    )
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
        socket.emit('chat', 'send', this.props.dest, this.state.text);
        console.log(this.state.text);
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

class Search extends React.Component<{}, Message> {
    constructor(props: {}) {
        super(props);
        this.state = { text: "" };
        this.searchSmth = this.searchSmth.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
    }

    searchSmth(event: any) {
        event.preventDefault();
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
                    <input type="textarea" className="searchBar" placeholder="Search" value={text} onChange={this.handleMessage} />
                    <input type="submit" className="searchButton" value="👆" />
                </form>
            </div>
        )
    }
}


class ChangeDestination extends React.Component<IChat, Message> {
    constructor(props : IChat) {
        super(props);
        this.state = {text: ''};
        this.handleDestination = this.handleDestination.bind(this);
        this.changeDestination = this.changeDestination.bind(this);
    }

    handleDestination(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({text: event.target.value});
    }

    changeDestination(event: any) {
        event.preventDefault();
        this.props.action(this.state.text);
        this.setState({text: ''});
    }

    render() {
        const text: string = this.state.text;
        return (
            <div className="changeLocation">
                <form className="changeLocationForm" onSubmit={this.changeDestination}>
                    <input type="textarea" placeholder="insert the new destination..." value={text} onChange={this.handleDestination} />
                    <input type="submit" value="change" />
                </form>
            </div>
        )
    }
}

class ChannelList extends React.Component {
    render() {
        return (
            <div className="channelList">
                <ul>
                    <li>Channel 1</li>
                    <li>Channel 2</li>
                    <li>Channel 3</li>
                    <li>Channel 4</li>
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
                    <ChannelList />
                </div>
                <div className="chatMessageWrapper">
                    <Header dest={this.state.dest} />
                    <MessageList dest={this.state.dest} history={this.state.history} action={this.handleNewMessageOnHistory} />
                    <SendMessageForm dest={this.state.dest} />
                    {/* <ChangeDestination action={this.changeLoc} /> */}
                </div>
            </div>
        )
    }
}
