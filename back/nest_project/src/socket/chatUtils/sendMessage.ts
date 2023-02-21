import {Server, Socket} from 'socket.io'

export function send(dest: string, message: string, server: Server, client: Socket) : void {
    if (dest[0] == '_')
    {
        server.emit("newMessage", dest, client.id, message);
        client.emit("notice", 'message send');
        console.log(server.of("/").sockets[client.id]);
    }
    else
    {
       let friend: Socket = server.of("/").sockets[client.id];
       friend.emit("newMessage", dest, client.id, message);
    }
}
