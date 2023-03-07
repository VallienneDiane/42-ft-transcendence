import React from "react";
import io from 'socket.io-client';

const SocketContext = React.createContext({
	socket: io(),
	createSocket: () => {},
	disconnect: () => {},
});

export default SocketContext;