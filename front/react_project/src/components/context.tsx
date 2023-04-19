import React from "react";
import io from 'socket.io-client';
import { SocketContextType } from "./ChatModule/Chat_models";

export const SocketContext = React.createContext<SocketContextType>({
	socket: io(),
	createSocket: () => {},
	disconnect: () => {},
	socketGame: io(),
	createSocketGame: () => {},
	disconnectGame: () => {},
});
