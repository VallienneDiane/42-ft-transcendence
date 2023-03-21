import './App.css'
import NavBar from './components/Navbar'
import PingHandler from './components/SocketHandler'
import ChatModule from './components/ChatModule';
import SignupPage from './components/SignupPage'
import LoginPage from './components/LoginPage'
import Home from './components/Home'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Profile from './components/Profile';
import ProtectedRoutes from './components/ProtectedRoutes';
import Chat from './components/Chat'
import Layout from './components/Layout'
import Game from './components/Game'
import Settings from './components/Settings'
import VerifyCode2fa from './components/VerifyCode2fa'

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
              <Route path='/login' element={<LoginPage />} />
              <Route path='/signup' element={<SignupPage />} />
              <Route path='/verifyCode2fa' element={<VerifyCode2fa />} />
              <Route element={<ProtectedRoutes/>}>
                <Route path='/' element={<Home />} />
                <Route path='/game' element={<Game />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/profile/:id' element={<Profile />} />
                <Route path='/settings' element={<Settings />} />
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
