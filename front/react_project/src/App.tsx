import './App.css'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Home from './components/Home'
import { Routes, Route } from "react-router-dom"
import Profile from './components/Profile';
import UserProvider from './user/UserProvider';
import ProtectedRoutes from './components/ProtectedRoutes';

function App() {
  let user = {
    id: 666,
    login: "",
    email: "",
    password: "",
    logedIn: false
  };

    return (
      <div className="App">
        <UserProvider user={user}>
          <Routes>
            <Route path='/login' element={<LoginForm />} />
            <Route path='/signin' element={<SignupForm />} />
            <Route element={<ProtectedRoutes/>}>
              <Route path='/profile' element={<Profile />} />
              <Route path='/profile/:id' element={<Profile />} />
              <Route path='/' element={<Home />} />
            </Route>
          </Routes>
        </UserProvider>
      </div>
  )
}

// export default App
