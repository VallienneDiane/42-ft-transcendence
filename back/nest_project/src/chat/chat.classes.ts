import { Socket } from "socket.io";

class Room {
    private c: Map<string, Socket>;

    constructor() {
        this.c = new Map<string, Socket>();
    }

    public set(userName: string, socket: Socket) {
        return this.c.set(userName, socket);
    }

    public get(userName: string) {
        return this.c.get(userName);
    }

    public delete(userName: string) {
        return this.c.delete(userName);
    }

    public size() {
        return this.c.size;
    }

    public forEach(callbackfn: (value: Socket, key: string, map: Map<string, Socket>) => void): void {
        this.c.forEach((value, key, map) => {callbackfn(value, key, map)});
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

    public addUserInRoom(roomName: string, userName: string, userSocket: Socket): void {
        let found = this.rooms.get(roomName);
        if (found == undefined)
            found = this.rooms.set(roomName, new Room()).get(roomName);
        found.set(userName, userSocket);
    }

    public deleteUserInRoom(roomName: string, userName: string): void {
        let found = this.rooms.get(roomName);
        if (found != undefined) {
            found.delete(userName);
            if (!found.size())
                this.rooms.delete(roomName);
        }
    }

    public changeRoomUser(roomName: string, userName: string, userSocket: Socket, currentRoomName: string) {
        if (currentRoomName != undefined)
            this.deleteUserInRoom(currentRoomName, userName);
        this.addUserInRoom(roomName, userName, userSocket);
    }

    //this function can be used to change a room name or to put all element in "room1" to "room2"
    public movingAway(currentRoomName: string, nextRoomName: string) {
        let found = this.rooms.get(currentRoomName);
        if (found != undefined) {
            let foundNext = this.rooms.get(nextRoomName);
            if (foundNext == undefined)
                this.rooms.set(nextRoomName, found);
            else
                found.forEach(
                    (socket, key) => {foundNext.set(key, socket);}
                )
        }
    }

    public userChangeName(userCurrentName: string, userNewName: string, roomName: string) {
        if (roomName != undefined) {
            let found = this.rooms.get(roomName);
            if (found != undefined) {
                let socket = found.get(userCurrentName);
                found.delete(userCurrentName);
                found.set(userNewName, socket);
            }
        }
    }

    public roomSize(roomName: string): number {
        return this.rooms.get(roomName).size();
    }

    public of(roomName: string) {
        return this.rooms.get(roomName);
    }

}

class UserRoomMap {
    private users: Map<string, {socket: Socket, room: string, isChannel: boolean}>;

    constructor() {
        this.users = new Map<string, {socket: Socket, room: string, isChannel: boolean}>();
    }

    public set(userName: string, userData: {socket: Socket, room: string, isChannel: boolean}) {
        this.users.set(userName, userData);
    }

    public changeName(currentUserName: string, newUserName: string) {
        let found = this.users.get(currentUserName);
        if (found != undefined) {
            if (this.users.get(newUserName) == undefined) {
                this.users.delete(currentUserName);
                this.users.set(newUserName, found);
            }
        }
    }

    public userChangeRoom(userName: string, room: string, isChannel: boolean) {
        let found = this.users.get(userName);
        if (found != undefined) {
            found.room = room;
            found.isChannel = isChannel;
        }
    }

    public get(userName: string) {
        return this.users.get(userName);
    }

    public delete(userName: string) {
        return this.users.delete(userName);
    }
}

export class UserRoomHandler {
    public roomMap: RoomMap;
    public userMap: UserRoomMap;

    constructor() {
        this.roomMap = new RoomMap();
        this.userMap = new UserRoomMap();
    }

    public addUser(userName: string, socket: Socket, roomName: string, isChannel: boolean) {
        if (isChannel)
            this.roomMap.addUserInRoom(roomName, userName, socket);
        this.userMap.set(userName, {socket: socket, room: roomName, isChannel: isChannel});
    }

    public joinRoom(userName: string, roomName: string, isChannel: boolean) {
        let currentRoom = this.userMap.get(userName);
        if (currentRoom.isChannel)
            this.roomMap.deleteUserInRoom(currentRoom.room, userName);
        if (isChannel)
            this.roomMap.addUserInRoom(roomName, userName, currentRoom.socket);
        this.userMap.userChangeRoom(userName, roomName, isChannel);
    }

    //This extract an user from rooms and return the room where he was 
    //if at least one other person is in that channel, otherwise it returns undefined
    public delUser(userName: string): string {
        let foundRoom = this.userMap.get(userName);
        let channelFound = undefined;
        if (foundRoom != undefined) {
            if (foundRoom.isChannel) {
                if (this.roomMap.roomSize(foundRoom.room) > 1)
                    channelFound = foundRoom.room;
                this.roomMap.deleteUserInRoom(foundRoom.room, userName);
            }
            this.userMap.delete(userName);
        }
        return (channelFound);
    }

    //return the pair {room, isChannel} or undefined if user not exists
    public getRoom(userName: string): {room: string, isChannel: boolean} {
        let found = this.userMap.get(userName);
        if (found != undefined)
            return {room: found.room, isChannel: found.isChannel};
        return undefined;
    }
}