import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';
import './ChatModule.css'

const socket = socketIOClient("127.0.0.1:3000", {transports : ['websocket']})

interface Message {
    text: string;
    senderName?: string;
}

interface ChatHistory {
    messages: Message[];
}

function ListMessage(value: Message): JSX.Element {
    return (
        <div className="message">
            <div className="messageUserName">{value.senderName}</div>
            <div className="bubble">{value.text}</div>
        </div>
    )   
}

class MessageList extends React.Component<{}, ChatHistory> {
    constructor(props: {}) {
        super(props);
        this.state = { messages: [] };
    }

    componentDidMount(): void {
        socket.on('newMessage', (...data: string[]) => {
            console.log('message from nest : ' + data);
            var pouet: Message = {text : data[1], senderName: data[0]};
            this.setState({
                messages: [...this.state.messages, pouet]
            });
        });
        console.log('chat history : ' + this.state.messages);
    }

    componentWillUnmount(): void {
        socket.off('newMessage');
    }

    render() {
        const listItems: JSX.Element[] = this.state.messages.slice(0).reverse().map(
            (message, id) => <ListMessage key={id} text={message.text} senderName={message.senderName} />
        );
        return (
            <div className="messageList">
                {listItems}
            </div>
        );
    }
}

function Header() {
    return (
        <div className="chatMessageHeader">
            <h1>Channel 1</h1>
            First test
        </div>
    )
}

class SendMessageForm extends React.Component<{}, Message> {
    constructor(props: {}) {
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
        socket.emit('message', this.state.text);
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
    }

    handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ text: event.target.value });
    }

    render() {
        const text: string = this.state.text;
        return (
            <div className="chatSearchHeader">
                <form onSubmit={this.searchSmth}>
                    <input type="textarea" className="searchBar" placeholder="Type your message..." value={text} onChange={this.handleMessage} />
                    <input type="submit" value="Send" />
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
                </ul>
            </div>
        )
    }
}

export default class ChatModule extends React.Component {
    render() {
        return (
            <div className="chatWrapper">
                <div className="left">
                    <Search />
                    <ChannelList />
                </div>
                <div className="chatMessageWrapper">
                    <Header />
                    <MessageList />
                    <SendMessageForm />
                </div>
            </div>
        )
    }
}
