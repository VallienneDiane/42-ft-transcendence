import {Server, Socket} from 'socket.io'

export function send(dest: string, message: string, server: Server, client: Socket) : void {
    if (dest[0] == '_')
    {
        server.emit("newMessage", dest, client.id, message);
        client.emit("notice", 'message send');
    }
    else
    {
        let friend: Socket = server.of("/").sockets.get(dest);
        //console.log(friend.id);
        if (friend != undefined) {
            friend.emit("newMessage", dest, client.id, message);
            client.emit("newMessage", dest, client.id, message);
            client.emit("notice", 'message send');
        }
        else
            client.emit("notice", 'this user doesn\'t exist');
    }
}
