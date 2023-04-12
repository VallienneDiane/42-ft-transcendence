import './App.css'
import ChatModule from './components/ChatModule/ChatModule';
import SignupPage from './components/SignupPage'
import LoginPage from './components/LoginPage'
import Home from './components/Home'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Profile from './components/Profile';
import ProtectedRoutes from './components/ProtectedRoutes';
import SocketContext from './components/context';
import { accountService } from "./services/account.service";
import { useState } from "react";
import Layout from './components/Layout'
import Game from './components/Game'
import Callback from './components/Callback'
import { io, Socket } from 'socket.io-client';
import Settings from './components/Settings'
import VerifyCode2fa from './components/VerifyCode2fa'
import HomeSettings from './components/HomeSettings';

function App() {
  const [socket, setSocket] = useState<Socket>(io('127.0.0.1:3000/chat',
  {
    autoConnect: false,
    transports: ['websocket'],
    auth: { token: 'undefined' },
  }));
  socket.on("test", () => {
    console.log("Id1", socket.id);
  });

  function createSocket() {
    const newSocket = io('127.0.0.1:3000/chat', {
      transports: ['websocket'],
      auth: { token: accountService.getToken() },
    });
    setSocket(newSocket);
  }

  function disconnect() {
    if (socket) {
      socket.disconnect();
      // setSocket(null);
    }
  }

  return (
    <div className="App">
      <BrowserRouter >
        <SocketContext.Provider value={{ socket, createSocket, disconnect }} >
          <Routes>
            <Route path="/callback/" element={<Callback />} />
            <Route path='/homeSettings' element={<HomeSettings />} />
            <Route element={<Layout />}>
              <Route path='/login' element={<LoginPage />} />
              <Route path='/signup' element={<SignupPage />} />
              <Route path='/verifyCode2fa' element={<VerifyCode2fa />} />
              <Route element={<ProtectedRoutes />}>
                <Route path='/' element={<Home />} />
                <Route path='/game' element={<Game />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/profile/:login' element={<Profile />} />
                <Route path='/settings' element={<Settings />} />
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
