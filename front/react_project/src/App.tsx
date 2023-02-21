import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Axios from 'axios';
import * as yup from "yup";
import './App.css'
import SignupForm from './page_modules/SignupForm'
import NavBar from './page_modules/NavBar'
import LoginForm from './page_modules/LoginForm'
import PingHandler from './page_modules/SocketHandler'
import ChatModule from './page_modules/ChatModule';

function App() {

    return (
      <div className="App">
          {/* <NavBar/>
          <SignupForm/>
          <LoginForm/>
          <PingHandler/> */}
          <ChatModule />
          {/* <ChatHandler /> */}
      </div>
  )
}

export default App
