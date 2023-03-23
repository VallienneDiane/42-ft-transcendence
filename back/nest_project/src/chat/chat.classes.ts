import { Socket } from "socket.io";
import { ChannelEntity } from "./channel/channel.entity";

class Room {
    private c: Map<string, Socket>;

    constructor() {
        this.c = new Map<string, Socket>();
    }

    public set(userId: string, socket: Socket) {
        return this.c.set(userId, socket);
    }

    public get(userId: string) {
        return this.c.get(userId);
    }

    public delete(userId: string) {
        return this.c.delete(userId);
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

    public addUserInRoom(roomId: string, userId: string, userSocket: Socket): void {
        let found = this.rooms.get(roomId);
        if (found == undefined)
            found = this.rooms.set(roomId, new Room()).get(roomId);
        found.set(userId, userSocket);
    }

    public deleteUserInRoom(roomId: string, userId: string): void {
        let found = this.rooms.get(roomId);
        if (found != undefined) {
            found.delete(userId);
            if (!found.size())
                this.rooms.delete(roomId);
        }
    }

    public changeRoomUser(roomId: string, userId: string, userSocket: Socket, currentRoomId: string) {
        if (currentRoomId != undefined)
            this.deleteUserInRoom(currentRoomId, userId);
        this.addUserInRoom(roomId, userId, userSocket);
    }

    //this function is used to put all element in "room1" to "room2"
    public movingAway(currentRoomId: string, nextRoomId: string) {
        let found = this.rooms.get(currentRoomId);
        if (found != undefined) {
            let foundNext = this.rooms.get(nextRoomId);
            if (foundNext == undefined)
                this.rooms.set(nextRoomId, found);
            else
                found.forEach(
                    (socket, key) => {foundNext.set(key, socket);}
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

class UserRoomMap {
    private users: Map<string, {socket: Socket, room: string, isChannel: boolean, isGod: boolean, isOP: boolean, onlyOpCanTalk: boolean}>;

    constructor() {
        this.users = new Map<string, {socket: Socket, room: string, isChannel: boolean, isGod: boolean, isOP: boolean, onlyOpCanTalk: boolean}>();
    }

    public set(userId: string, userData: {socket: Socket, room: string, isChannel: boolean, isGod: boolean, isOP: boolean, onlyOpCanTalk: boolean}) {
        this.users.set(userId, userData);
    }

    public userChangeRoom(userId: string, room: string, isChannel: boolean, isGod: boolean, isOP: boolean, onlyOpCanTalk: boolean) {
        let found = this.users.get(userId);
        if (found != undefined) {
            found.room = room;
            found.isChannel = isChannel;
            found.isGod = isGod;
            found.isOP = isOP;
            found.onlyOpCanTalk = onlyOpCanTalk;
        }
    }

    public userBecomeOp(userId: string, channelId: string) {
        let found = this.users.get(userId);
        if (found != undefined && found.isChannel && found.room == channelId)
            found.isOP = true;
    }

    public userBecomeNoOp(userId: string, channelId: string) {
        let found = this.users.get(userId);
        if (found != undefined && found.isChannel && found.room == channelId)
            found.isOP = false;
    }

    public get(userId: string) {
        return this.users.get(userId);
    }

    public delete(userId: string) {
        return this.users.delete(userId);
    }

    public emit(ev: string, ...args: any[]) {
        this.users.forEach((user) => {
            user.socket.emit(ev, ...args);
        });
    }

    public emitExcept(ev: string, exceptName: string, ...args: any[]) {
        this.users.forEach((user, name) => {
            if (exceptName != name)
                user.socket.emit(ev, ...args);
        });
    }
}

export class UserRoomHandler {
    public roomMap: RoomMap;
    public userMap: UserRoomMap;

    constructor() {
        this.roomMap = new RoomMap();
        this.userMap = new UserRoomMap();
    }

    public addUser(userId: string, socket: Socket, roomId: string, isChannel: boolean, isGod: boolean, isOP: boolean, onlyOpCanTalk: boolean) {
        if (isChannel)
            this.roomMap.addUserInRoom(roomId, userId, socket);
        this.userMap.set(userId, {socket: socket, room: roomId, isChannel: isChannel, isGod: isGod, isOP: isOP, onlyOpCanTalk: onlyOpCanTalk});
    }

    public roomKill(channelId: string) {
        let locGeneral: ChannelEntity = {
            id: "general",
            name: "general",
            date: new Date(),
            password: false,
            channelPass: null,
            opNumber: 0,
            inviteOnly: false,
            persistant: true,
            onlyOpCanTalk: false,
            hidden: false,
            normalUsers: [],
            opUsers: [],
            messages: []
        }
        let room = this.roomMap.of(channelId);
        if (room != undefined) {
            room.forEach( (socket, user) => {
                this.userMap.userChangeRoom(user, 'general', true, false, false, false);
                socket.emit('newLocChannel', locGeneral, false, []);
                socket.emit('leaveChannel', channelId);
            })
            this.roomMap.movingAway(channelId, 'general');
        }
    }

    public joinRoom(userId: string, roomId: string, isChannel: boolean, isGod: boolean, isOp: boolean, onlyOpCanTalk: boolean) {
        let currentRoom = this.userMap.get(userId);
        if (currentRoom.isChannel)
            this.roomMap.deleteUserInRoom(currentRoom.room, userId);
        if (isChannel)
            this.roomMap.addUserInRoom(roomId, userId, currentRoom.socket);
        this.userMap.userChangeRoom(userId, roomId, isChannel, isGod, isOp, onlyOpCanTalk);
    }

    //This extract an user from rooms and return the room where he was 
    //if at least one other person is in that channel, otherwise it returns undefined
    public delUser(userId: string): string {
        let foundRoom = this.userMap.get(userId);
        let channelFound = undefined;
        if (foundRoom != undefined) {
            if (foundRoom.isChannel) {
                if (this.roomMap.roomSize(foundRoom.room) > 1)
                    channelFound = foundRoom.room;
                this.roomMap.deleteUserInRoom(foundRoom.room, userId);
            }
            this.userMap.delete(userId);
        }
        return (channelFound);
    }

    //return the pair {room, isChannel} or undefined if user not exists
    public getRoom(userId: string): {room: string, isChannel: boolean} {
        let found = this.userMap.get(userId);
        if (found != undefined)
            return {room: found.room, isChannel: found.isChannel};
        return undefined;
    }
}