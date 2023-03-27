import React, { useState, useEffect } from "react";
import { Socket } from 'socket.io-client';
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { IMessageToSend, Message, IDest } from "../../models";

function MessageDisplay(value: {sender: string, text: string}): JSX.Element {
    const [me, setMe] = useState<boolean>(false);
    const playload: JwtPayload = accountService.readPayload()!;

    useEffect(() => {
    if (playload.login === value.sender) {
        setMe(true);
    }}, [])

    return (
        <div className={me ? "message sent" : "message received"}>
            <div className="messageUserName">{value.sender}</div>
            <div className="bubble">
                <div className="messageText">{value.text}</div>
            </div>
        </div>
    )
}

export class MessageList extends React.Component<{history: Message[], action: any, socket: Socket}, {}> {
    constructor(props: {history: Message[], action: any, socket: Socket}) {
        super(props);
    }

    componentDidMount(): void {
        this.props.socket!.on("newMessage", (data: IMessageToSend) => {
            console.log('message from nest newMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        });

        this.props.socket!.on('selfMessage', (data: IMessageToSend) => {
            console.log('message from nest selfMessage: ' + data.content + ', ' + data.sender);
            this.props.action({id: data.date.toString(), text: data.content, sender: data.sender});
        })

        this.props.socket!.on('notice', (data: string) => {
            console.log(data);
            let date = new Date();
            this.props.action({id: date.toString(), text: data, sender: "Message from server :"});
        })
    }

    componentWillUnmount(): void {
        this.props.socket!.off('newMessage');
        this.props.socket!.off('notice');
        this.props.socket!.off('selfMessage')
    }

    render() {
        const tmpList: Message[] = this.props.history!;
        const listItems: JSX.Element[] = tmpList.reverse().map(
            (message) => <MessageDisplay key={message.id} sender={message.sender!} text={message.text} />
        );
        return (
            <div id="messageList">
                {listItems}
            </div>
        );
    }
}

export class SendMessageForm extends React.Component<{dest: IDest, socket: Socket}, {text: string}> {
    constructor(props: {dest: IDest, socket: Socket}) {
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
        this.props.socket!.emit('addMessage', content);
        this.setState({ text: '' });
    }

    render() {
        return (
            <div id="sendMessage">
                <form className="sendMessageForm" onSubmit={this.sendMessage}>
                    <input type="textarea" placeholder="Type your message..." value={this.state.text} onChange={this.handleMessage} />
                    <button className="send">
                        <svg className="svgSend" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>
                    </button>
                </form>
            </div>
        )
    }
}
