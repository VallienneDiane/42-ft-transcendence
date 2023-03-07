import './App.css'
import NavBar from './components/Navbar'
import PingHandler from './components/SocketHandler'
import ChatModule from './components/ChatModule';
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Home from './components/Home'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Profile from './components/Profile';
import UserProvider from './user/UserProvider';
import ProtectedRoutes from './components/ProtectedRoutes';
import Chat from './components/Chat'
import Layout from './components/Layout'
import Game from './components/Game'
import SocketContext from './components/context';
import { accountService } from "./services/account.service";
import io from 'socket.io-client';
import { Socket } from 'socket.io-client';
import React, { useState} from "react";

function App() {
  const [socket, setSocket] = useState<Socket>(io('127.0.0.1:3000/chat',
  {
    autoConnect: false,
    transports: ['websocket'],
    auth: { token: 'undefined' },
  }));
  // console.log("avant:", socket);

  function createSocket() {
    console.log("blop2");
    const newSocket = io('127.0.0.1:3000/chat', {
      transports : ['websocket'],
      auth : { token: accountService.getToken() },
    });
    newSocket.connect();
    setSocket(newSocket);
  }

  return (
    <div className="App">
      <BrowserRouter >
        <SocketContext.Provider value={{ socket, createSocket }} >
        <Routes>
          <Route element={<Layout />}>
            <Route path='/login' element={<LoginForm />} />
            <Route path='/signin' element={<SignupForm />} />
            <Route element={<ProtectedRoutes/>}>
              <Route path='/' element={<Home />} />
              <Route path='/game' element={<Game />} />
              <Route path='/profile' element={<Profile />} />
              <Route path='/profile/:id' element={<Profile />} />
              <Route path='/' element={<Home />} />
              <Route path='/chat' element={<ChatModule />} />
            </Route>
          </Route>
        </Routes>
        </SocketContext.Provider>
      </BrowserRouter>
    </div>
  )
}

export default App
