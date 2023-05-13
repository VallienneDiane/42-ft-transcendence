import './App.css'
import ChatModule from './components/ChatModule/ChatModule';
import SignupPage from './components/SignupPage'
import LoginPage from './components/LoginPage'
import Home from './components/Home'
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom"
import Profile from './components/ProfileModule/Profile';
import ProtectedRoutes from './components/ProtectedRoutes';
import { SocketContext } from './components/context';
import { accountService } from "./services/account.service";
import { useState } from "react";
import Layout from './components/Layout'
import Game from './components/Game'
import Callback from './components/Callback'
import { io, Socket } from 'socket.io-client';
import Settings from './components/SettingsModule/Settings'
import VerifyCode2fa from './components/VerifyCode2fa'
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import HomeSettings from './components/HomePageSettings';
import PopUp from './components/PopUp';
import NotFound from './components/NotFound';

function App() {
  const [socket, setSocket] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>(null!);

  function createSocket() {
    const newSocket = io('127.0.0.1:3000/chat', {
      transports: ['websocket'],
      auth: { token: accountService.getToken() },
    });
    setSocket(newSocket);
    newSocket.emit("whereIam");
  }

  const [socketGame, setSocketGame] = useState<Socket<DefaultEventsMap, DefaultEventsMap>>(null!);

  function createSocketGame() {
    const newSocket = io('127.0.0.1:3000', {
      transports: ['websocket'],
      auth: { token: accountService.getToken() },
    });
    setSocketGame(newSocket);
  }

  function disconnectGame() {
    if (socketGame) {
      socketGame.disconnect();
      setSocketGame(null!);
    }
  }

  function disconnect() {
    console.log("avant", socket);
    if (socket) {
      console.log("before disconnect", socket.id);
      socket.disconnect();
      setSocket(null!);
    }
  }

  return (
    <div className="App">
      <SocketContext.Provider value={{ socket, createSocket, disconnect, socketGame, createSocketGame, disconnectGame }} >
        <BrowserRouter >
            <Routes>
              <Route path="/callback/"element={<Callback />}/>
              <Route path='/homeSettings' element={ accountService.isLogged() ? <Navigate to="/"/> : (<HomeSettings/>) }/>
              <Route element={<Layout />}>
                <Route path='/login' element={<LoginPage />} />
                <Route path='/signup' element={<SignupPage />} />
                <Route path='/verifyCode2fa' element={<VerifyCode2fa />} />
                <Route element={<ProtectedRoutes />}>
                  <Route path='*' element={<NotFound />}/>
                  <Route path='/' element={<Home />} />
                  <Route path='/game' element={<Game />} />
                  <Route path='/profile' element={<Profile />} />
                  <Route path='/profile/:login' element={<Profile />} />
                  <Route path='/settings' element={<Settings />} />
                  <Route path='/chat' element={<ChatModule />} />
                </Route>
              </Route>
            </Routes>
        </BrowserRouter>
      </SocketContext.Provider>
    </div>
  )
}

export default App
