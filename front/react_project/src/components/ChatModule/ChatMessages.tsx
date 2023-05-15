import React, { ContextType } from "react";
import { JwtPayload } from "jsonwebtoken";
import { accountService } from "../../services/account.service";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IMessage, IDest, IMessageReceived } from "./Chat_models";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { SocketContext } from "../context";
import LogoOrdi from'../../assets/LogoOrdi.jpg';

class MessageDisplay extends React.Component<{message: IMessage, prevSender: string, last: boolean}, {
    payload: JwtPayload, me: boolean, sameSender: boolean, avatar: string}> {
    constructor(props: {message: IMessage, prevSender: string, last: boolean}) {
        super(props);
        this.state = { payload: accountService.readPayload()!, 
        me: false,
        sameSender: false, 
        avatar: '' };
        this.setTimeAgo = this.setTimeAgo.bind(this);
        this.getProfilePicture = this.getProfilePicture.bind(this);
    }

    componentDidMount(): void {
        if (this.props.prevSender === this.props.message.senderName)
            this.setState({ sameSender: true });
        if (this.state.payload.sub === this.props.message.senderId)
            this.setState({ me: true });
        if (this.props.prevSender !== this.props.message.senderName && this.state.payload.sub !== this.props.message.senderId) {
            this.getProfilePicture();
        }
    }

    setTimeAgo() {
        const prev: Date = new Date(this.props.message.id);
        const now: Date = new Date();
        const secDiff: number = Math.round((now.getTime() - prev.getTime()) / 1000);
        let diff: number = secDiff / (24 * 60 * 60);
        if (diff > 1)
            return Math.round(diff) + "d ago";
        diff = secDiff / (60 * 60);
        if (diff > 1)
            return Math.round(diff) + "h ago";
        diff = secDiff / 60;
        if (diff > 1)
            return Math.round(diff) + "m ago";
        return("Now");
    }

    getProfilePicture() {
        if (this.props.message.senderName !== "WARNING") {
            accountService.getAvatar(this.props.message.senderId!)
                .then(response => { 
                    this.setState({avatar: response.data});
                })
                .catch(error => console.log(error));
        }
        else
            this.setState({avatar: LogoOrdi})
    }

    render() {
            return (
                <div className={this.state.me ? "message sent" : "message received"}>
                    {(this.state.me == false) && <div className="avatar">
                        {(this.state.sameSender === false) && <img id="profilePicture" src={this.state.avatar} />}
                        </div>}
                    <div className="messageBlock">
                        {(this.state.sameSender === false) && <div className="messageUserName">{this.props.message.senderName}</div>}
                        <div className="bubble">
                            <div className="messageText">{this.props.message.content}</div>
                        </div>
                        {this.props.last && <div className="messageDate">{this.setTimeAgo()}</div>}
                    </div>
                </div>
            )
    }
}

export class MessageList extends React.Component<{history: IMessage[], handleHistory: any}, {usersBlocked: {id: string, name: string}[]}> {
    constructor(props: {history: IMessage[], handleHistory: any}) {
        super(props);
        this.state = {usersBlocked: []};
        this.checkBlock = this.checkBlock.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;

    componentDidMount(): void {
        this.context.socket.emit("listBlock");
        this.context.socket.on("listBlock", (array: {id: string, name: string}[]) => {
            this.setState({usersBlocked: array});
        })
        this.context.socket.on("newMessage", (data: IMessageReceived) => {
            this.props.handleHistory({id: data.date.toString(), content: data.content, senderName: data.senderName, senderId: data.senderId});
        });

        this.context.socket.on('selfMessage', (data: IMessageReceived) => {
            this.props.handleHistory({id: data.date.toString(), content: data.content, senderName: data.senderName, senderId: data.senderId});
        })

        this.context.socket.on('notice', (data: string) => {
            let date = new Date();
            this.props.handleHistory({id: date.toISOString(), content: data, senderName: "WARNING"});
        })
    }

    componentWillUnmount(): void {
        this.context.socket.off('listBlock');
        this.context.socket.off('newMessage');
        this.context.socket.off('selfMessage');
        this.context.socket.off('notice');
    }

    checkBlock(senderName: string) {
        let block: boolean = false;
        for (let elt of this.state.usersBlocked) {

            if (elt.name == senderName) {
                block = true;
            }
        }
        return block;
    }

    render() {
        let tmpList: IMessage[] = [...this.props.history!];
        let listItems: JSX.Element[] = tmpList.reverse().reduce((acc: JSX.Element[], message: IMessage, index: number, tmpList: IMessage[]) => {
            const block = this.checkBlock(message.senderName);
            if (block === false) {
                const length: number = tmpList.length;
                const prevSender: string = index < (length - 1) ? tmpList[index + 1].senderName! : '';
                let lastMessage : boolean = false;
                if (index === 0 || (index > 0 && tmpList[index - 1].senderName !== tmpList[index].senderName))
                    lastMessage = true;
                const messageDisplay = <MessageDisplay key={message.id} message={message} prevSender={prevSender!} last={lastMessage}/>;
                acc.push(messageDisplay);
            }
            return acc;
        }, []);

        return (
            <div id="messageList">
                {listItems}
            </div>
        );
    }
}

export class SendMessageForm extends React.Component<{dest: IDest}, {text: string}> {
    constructor(props: {dest: IDest}) {
        super(props);
        this.state = { text: '' };
        this.handleMessage = this.handleMessage.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
    }
    static contextType = SocketContext;
    declare context: ContextType<typeof SocketContext>;

    handleMessage(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ text: event.target.value });
    }

    sendMessage(event: any) {
        event.preventDefault();
        if (this.state.text.trim() !== '') {
            let content: string = this.state.text;
            this.context.socket.emit('addMessage', {message: content});
            this.setState({ text: '' });
        }
    }

    render() {
        return (
            <div id="sendMessage">
                <form className="sendMessageForm" onSubmit={this.sendMessage}>
                    <input type="textarea" placeholder="Type your message..." value={this.state.text} onChange={this.handleMessage} maxLength={2048}/>
                    <button className="send">
                        <FontAwesomeIcon className="svgSend" icon={faPaperPlane} />
                    </button>
                </form>
            </div>
        )
    }
}
