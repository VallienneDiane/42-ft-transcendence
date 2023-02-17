import React, { useState, useEffect } from "react";
import socketIOClient from 'socket.io-client';

const socket = socketIOClient("127.0.0.1:3000", {transports: ['websocket']});

function PingHandler(): JSX.Element {
  const [isConnected, setIsConnected] = useState<Boolean>(socket.connected);
  const [lastPong, setLastPong] = useState<string>("");
  const [lastPing, setLastPing] = useState<string>("");
  const [serverId, setServerID] = useState<string>(socket.id);

  useEffect(() => {
      socket.on('connect', () => {
          setIsConnected(true);
      });

      socket.on('disconnected', () => {
          setIsConnected(false);
      });

      socket.on('pong', () => {
          const bug : string = new Date().toISOString();
          setServerID(socket.id);
          setLastPong(bug);
      });

      return () => {
          socket.off('connect');
          socket.off('disconnect');
          socket.off('pong');
      };
  }, []);

  const sendPing = () => {
      socket.emit('ping', 'j\'apprecie les fruits au sirop.');
      const bug: string = new Date().toISOString();
      setLastPing(bug);
  }

  return (
      <div className="block">
          <p>Connected: { isConnected === true ? 'YES' : 'NO' } </p>
          <p>Last pong: { lastPong || '-' }</p>
          <p>Last ping: { lastPing || '-' }</p>
          <p>Server id: { serverId }</p>
          <button onClick={ sendPing }>Send ping </button>
      </div>
  );
}

export default PingHandler;