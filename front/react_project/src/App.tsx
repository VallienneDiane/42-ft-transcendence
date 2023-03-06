import './App.css'
import NavBar from './components/Navbar'
import PingHandler from './components/SocketHandler'
import ChatModule from './components/ChatModule';
import SignupForm from './components/SignupPage'
import LoginForm from './components/LoginPage'
import Home from './components/Home'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Profile from './components/Profile';
import UserProvider from './user/UserProvider';
import ProtectedRoutes from './components/ProtectedRoutes';
import Chat from './components/Chat'
import Layout from './components/Layout'
import Game from './components/Game'
import { io, Socket } from 'socket.io-client';


function App() {
  // let user = {
  //   token: "",
  //   id: 666,
  //   login: "",
  //   email: "",
  //   password: "",
  // };

    return (
      <div className="App">
        {/* <UserProvider user={user}> */}
        <BrowserRouter >
          <Routes>
            <Route element={<Layout />}>
              <Route path='/login' element={<LoginForm />} />
              <Route path='/signin' element={<SignupForm />} />
              <Route element={<ProtectedRoutes/>}>
                <Route path='/' element={<Home />} />
                <Route path='/game' element={<Game />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/profile/:id' element={<Profile />} />
                <Route path='/chat' element={<ChatModule />} />
              </Route>
            </Route>

          </Routes>
        </BrowserRouter>
        {/* </UserProvider> */}
      </div>
  )
}

export default App
