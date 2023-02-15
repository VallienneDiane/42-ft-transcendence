import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Axios from 'axios';
import * as yup from "yup";
import './App.css'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Home from './components/Home'
import { Routes, Route } from "react-router-dom"
import Profile from './components/Profile';
import { UserContext } from './user/UserContext';

function App() {

    return (
      <div className="App">
        <Routes>
          {/* <UserContext.Provider value={{}}> */}
            <Route path='/login' element={<LoginForm/>}/>
            <Route path='/signin' element={<SignupForm/>}/>
            {/* Route pour par exemple localhost/profile/12 */}
            <Route path='/profile/:id' element={<Profile/>}/>
            {/* Route pour par exemple localhost/profile/12/games/win */}
            <Route path='/profile/*' element={<Profile/>}/>

          {/* </UserContext.Provider> */}
          <Route path='/' element={<Home/>}/>
        </Routes>
      </div>
  )
}

export default App
