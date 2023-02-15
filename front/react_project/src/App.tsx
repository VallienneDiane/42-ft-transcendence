import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Axios from 'axios';
import * as yup from "yup";
import './App.css'
import SignupForm from './page_modules/SignupForm'
import NavBar from './page_modules/NavBar'
import LoginForm from './page_modules/LoginForm'

// type defaultFormData = {
//   login: string,
//   email: string,
//   password: string,
// }

// const userSchema = yup.object().shape({
//   login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
//   email: yup.string().required("Email is required"),
//   password: yup.string().required("Password is required") .min(8, "Password must be at least 8 characters"),
// })

function App() {
//   const { register, handleSubmit, formState: { errors }} = useForm<defaultFormData>({
//     resolver: yupResolver(userSchema)
//   });
  
//   const onSubmit = (data: defaultFormData) => {
//     Axios.post('http://localhost:3000/user/signup', data);
//     console.log(data);
//   }

    return (
      <div className="App">
          {/* <NavBar/> */}
          <SignupForm/>
          {/* <LoginForm/> */}
      </div>
  )
}

export default App
