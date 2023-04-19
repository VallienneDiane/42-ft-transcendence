import { Socket } from "socket.io";
import { ChannelEntity } from "./channel/channel.entity";

class Room {
    public c: Set<Socket>;

    constructor() {
        this.c = new Set<Socket>();
    }

    public set(socket: Socket) {
        return this.c.add(socket);
    }

    public delete(socket: Socket) {
        return this.c.delete(socket);
    }

    public size() {
        return this.c.size;
    }

    public emit(ev: string, ...args: any[]) {
        this.c.forEach((socket) => {
            socket.emit(ev, ...args);
        })
    }
}

class RoomMap {

    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map<string, Room>();
    }

    public addSocketInRoom(roomId: string, userSocket: Socket): void {
        let found = this.rooms.get(roomId);
        if (found == undefined)
            found = this.rooms.set(roomId, new Room()).get(roomId);
        found.set(userSocket);
    }

    public deleteSocketInRoom(roomId: string, userSocket: Socket): void {
        let found = this.rooms.get(roomId);
        if (found != undefined) {
            found.delete(userSocket);
            if (!found.size())
                this.rooms.delete(roomId);
        }
    }

    public changeRoomUser(roomId: string, userSocket: Socket, currentRoomId: string) {
        if (currentRoomId != undefined)
            this.deleteSocketInRoom(currentRoomId, userSocket);
        this.addSocketInRoom(roomId, userSocket);
    }

    //this function is used to put all element in "room1" to "room2"
    public movingAway(currentRoomId: string, nextRoomId: string) {
        let found = this.rooms.get(currentRoomId);
        if (found != undefined) {
            let foundNext = this.rooms.get(nextRoomId);
            if (foundNext == undefined)
                this.rooms.set(nextRoomId, found);
            else
                found.c.forEach(
                    (socket) => {foundNext.set(socket);}
                )
            this.rooms.delete(currentRoomId);
        }
    }

    public roomSize(roomId: string): number {
        let found = this.rooms.get(roomId);
        if (found != undefined)
            return this.rooms.get(roomId).size();
        return 0;
    }

    public of(roomId: string) {
        return this.rooms.get(roomId);
    }

}

class SocketMap {

    public sockets: Map<Socket, {userId: string, room: string, isChannel: boolean, isGod: boolean, isOp: boolean}>;

    constructor() {
        this.sockets = new Map<Socket, {userId: string, room: string, isChannel: boolean, isGod: boolean, isOp: boolean}>();
    }

    public emit(ev: string, ...args: any[]) {
        this.sockets.forEach(({}, socket) => {
            socket.emit(ev, ...args);
        })
    }

    public update(socket: Socket, room: string, isChannel: boolean, isGod: boolean, isOp: boolean) {
        let socketFound = this.sockets.get(socket);
        if (socketFound != undefined) {
            return this.sockets.set(socket, {userId: socketFound.userId, room: room, isChannel: isChannel, isGod: isGod, isOp: isOp});
        }
        return undefined;
    }
};

class UserMap {
    public users: Map<string, SocketMap>;

    constructor() {
        this.users = new Map<string, SocketMap>();
    }

    public set(userId: string, socket: Socket, room: string, isChannel: boolean, isGod: boolean, isOp: boolean): boolean {
        let found = this.users.get(userId);
        if (found == undefined) {
            this.users.set(userId, new SocketMap()).get(userId).sockets.set(socket, {userId: userId, room: room, isChannel: isChannel, isGod: isGod, isOp: isOp})
            return true;
        }
        else
            found.sockets.set(socket, {userId: userId, room: room, isChannel: isChannel, isGod: isGod, isOp: isOp});
        return false;
    }

    public userChangeRoom(userId: string, socket: Socket, room: string, isChannel: boolean, isGod: boolean, isOp: boolean) {
        let userFound = this.users.get(userId);
        if (userFound != undefined) {
            let found = userFound.sockets.get(socket);
            if (found != undefined) {
                found.room = room;
                found.isChannel = isChannel;
                found.isGod = isGod;
                found.isOp = isOp;
            }
        }
    }

    public userBecomeOp(userId: string, channelId: string) {
        let userFound = this.users.get(userId);
        if (userFound != undefined) {
            userFound.sockets.forEach((data) => {
                if (data.isChannel && data.room == channelId)
                    data.isOp = true;
            })
        }
    }

    public userBecomeNoOp(userId: string, channelId: string) {
        let userFound = this.users.get(userId);
        if (userFound != undefined) {
            userFound.sockets.forEach((data) => {
                if (data.isChannel && data.room == channelId)
                    data.isOp = false;
            })
        }
    }

    public get(userId: string) {
        return this.users.get(userId);
    }

    public deleteUser(userId: string) {
        return this.users.delete(userId);
    }

    public deleteSocket(userId: string, socket: Socket) {
        let userFound = this.users.get(userId);
        if (userFound != undefined) {
            userFound.sockets.delete(socket);
        }
    }

    public emit(userId: string, ev: string, ...args: any[]) {
        let userFound = this.users.get(userId);
        if (userFound != undefined)
            userFound.emit(ev, ...args);
    }

    public emitToAll(ev: string, ...args: any[]) {
        this.users.forEach((user) => {
            user.emit(ev, ...args);
        });
    }

    public emitExcept(ev: string, exceptName: string, ...args: any[]) {
        this.users.forEach((user, name) => {
            if (exceptName != name)
                user.emit(ev, ...args);
        });
    }
}

export class UserRoomHandler {
    public roomMap: RoomMap;
    public userMap: UserMap;
    public socketMap: SocketMap;

    constructor() {
        this.roomMap = new RoomMap();
        this.userMap = new UserMap();
        this.socketMap = new SocketMap();
    }

    public addUser(userId: string, socket: Socket, roomId: string, isChannel: boolean, isGod: boolean, isOp: boolean, onlyOpCanTalk: boolean): boolean {
        let newUser: boolean;
        if (isChannel)
            this.roomMap.addSocketInRoom(roomId, socket);
        newUser = this.userMap.set(userId, socket, roomId, isChannel, isGod, isOp);
        this.socketMap.sockets.set(socket, {userId: userId, room: roomId, isChannel: isChannel, isGod: isGod, isOp: isOp})
        return newUser;
    }

    public roomKill(channelId: string) {
        let locGeneral: ChannelEntity = {
            id: "00000000-0000-0000-0000-000000000000",
            name: "general",
            date: new Date(),
            password: false,
            channelPass: null,
            inviteOnly: false,
            normalUsers: [],
            opUsers: [],
            godUser: undefined,
            bannedUsers: [],
            usersMuted: [],
            messages: []
        }
        let room = this.roomMap.of(channelId);
        if (room != undefined) {
            room.c.forEach( (socket) => {
                let userToMove = this.socketMap
                    .update(socket, "general", true, false, false)
                    .get(socket).userId;
                this.userMap.userChangeRoom(userToMove, socket, "general", true, false, false);
                socket.emit("newLocChannel", {channel: locGeneral, status: "normal"}, []);
                socket.emit("channelDestroy", channelId);
            })
            this.roomMap.movingAway(channelId, "general");
        }
    }

    public joinRoom(userId: string, socket: Socket, roomId: string, isChannel: boolean, isGod: boolean, isOp: boolean) {
        let currentRoom = this.socketMap.sockets.get(socket);
        if (currentRoom.isChannel)
            this.roomMap.deleteSocketInRoom(currentRoom.room, socket);
        if (isChannel)
            this.roomMap.addSocketInRoom(roomId, socket);
        this.userMap.userChangeRoom(userId, socket, roomId, isChannel, isGod, isOp);
        this.socketMap.update(socket, roomId, isChannel, isGod, isOp);
    }

    //This extract an user from rooms and return the room where he was 
    //if at least one other person is in that channel, otherwise it returns undefined

    public delSocket(socket: Socket): boolean {
        let socketFound = this.socketMap.sockets.get(socket);
        let userGone = false;
        if (socketFound != undefined) {
            this.userMap.deleteSocket(socketFound.userId, socket);
            if (!this.userMap.get(socketFound.userId).sockets.size) {
                this.userMap.deleteUser(socketFound.userId);
                userGone = true;
            }
            if (socketFound.isChannel)
                this.roomMap.deleteSocketInRoom(socketFound.room, socket);
            this.socketMap.sockets.delete(socket);
        }
        return userGone;
    }

    //return the pair {room, isChannel} or undefined if user not exists
    public getRoom(socket: Socket): {room: string, isChannel: boolean} {
        let found = this.socketMap.sockets.get(socket);
        if (found != undefined)
            return {room: found.room, isChannel: found.isChannel};
        return undefined;
    }

    public emitToUserHavingThisSocket(socket: Socket, ev: string, ...args: any[]) {
        let socketFound = this.socketMap.sockets.get(socket);
        if (socketFound != undefined) {
            let userFound = this.userMap.get(socketFound.userId);
            if (userFound != undefined) {
                userFound.emit(ev, ...args);
            }
        }
    }

}