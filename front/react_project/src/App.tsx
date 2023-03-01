import './App.css'
import SignUpForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Home from './components/Home'
import { Routes, Route, BrowserRouter } from "react-router-dom"
import Profile from './components/Profile';
import UserProvider from './user/UserProvider';
import ProtectedRoutes from './components/ProtectedRoutes';
import Chat from './components/Chat'
import Layout from './components/Layout'
import Game from './components/Game'
import ToggleSwitch from './components/ToggleSwitch'

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
              <Route path='/signup' element={<SignUpForm />} />
              <Route element={<ProtectedRoutes/>}>
                <Route path='/' element={<Home />} />
                <Route path='/game' element={<Game />} />
                <Route path='/chat' element={<Chat />} />
                <Route path='/profile' element={<Profile />} />
                <Route path='/profile/:id' element={<Profile />} />
                <Route path='/settings' element={<ToggleSwitch />} />
              </Route>
            </Route>

          </Routes>
        </BrowserRouter>
        {/* </UserProvider> */}
      </div>
  )
}

export default App
