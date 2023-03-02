import React from "react";
import { Socket } from 'socket.io-client';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

const SocketContext = React.createContext<Socket<DefaultEventsMap, DefaultEventsMap> | null>(null)
  
export default SocketContext;