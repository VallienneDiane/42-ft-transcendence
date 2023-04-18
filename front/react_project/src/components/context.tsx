import React from "react";
import io from 'socket.io-client';

const SocketContext = React.createContext({
	socket: io(),
	createSocket: () => {},
	disconnect: () => {},
	socketGame: io(),
	createSocketGame: () => {},
	disconnectGame: () => {},
});

export default SocketContext;