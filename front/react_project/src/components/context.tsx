import React, { useState, useEffect } from "react";
import io, { Socket } from 'socket.io-client';
import { accountService } from "../services/account.service";
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

const SocketContext = React.createContext ({
	socket: io('127.0.0.1:3000/chat',
	{
	  autoConnect: false,
	  transports : ['websocket'],
	  auth : { token: undefined },
	}),
	createSocket: () => {
		console.log("blop2");
		const newSocket = io('127.0.0.1:3000/chat', {
		  transports : ['websocket'],
		  auth : { token: accountService.getToken() },
		});
		newSocket.connect();},
});

export default SocketContext;