import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Axios from 'axios';
import * as yup from "yup";
import NavBar from './Navbar';
import { UserContext } from '../user/UserContext';
import { Navigate, redirect } from 'react-router-dom';

// Interfaces are basically a way to describe data shapes, for example, an object.
// Type is a definition of a type of data, for example, a union, primitive, intersection, tuple, or any other type.
interface defaultFormData { 
  login: string,
  email: string,
<<<<<<< HEAD:front/react_project/src/components/SignupForm.tsx
  password: string
=======
  password: string,
  errors?: string
>>>>>>> master:front/react_project/src/User/SignupForm.tsx
}

const userSchema = yup.object().shape({
  login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
  email: yup.string().required("Email is required"),
  password: yup.string().required("Password is required") .min(8, "Password must be at least 8 characters"),
})

const SignupForm: React.FC = () => {
<<<<<<< HEAD:front/react_project/src/components/SignupForm.tsx
  let user = useContext(UserContext);
  
  
=======
>>>>>>> master:front/react_project/src/User/SignupForm.tsx
  const { register, handleSubmit, formState: { errors }} = useForm<defaultFormData>({
    resolver: yupResolver(userSchema)
  });
  
  const onSubmit = (data: defaultFormData) => {
    
    Axios.post('http://localhost:3000/user/signup', data);
    user.login = data.login;
    user.email = data.email;
    user.password = data.password;
    user.logedIn = true;
  }

  return (
    <div>
<<<<<<< HEAD:front/react_project/src/components/SignupForm.tsx
      <NavBar/>
      <h1>SignUp Page</h1>
=======
>>>>>>> master:front/react_project/src/User/SignupForm.tsx
      <form className="login" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Login</label>
          <br/>
          <input type="text" {...register("login")}/>
          {errors.login && <p className='errorsSignup'>{errors.login.message}</p>}   {/* optionnal fields : errors */}
        </div>
        <div>
          <label>Email</label>
          <br/>
          <input type="email" {...register("email")}/>
          {errors.email && <p className='errorsSignup'>{errors.email.message}</p>}
        </div>
        <div>
          <label>Password</label>
          <br/>
          <input type="password" {...register("password")}/>
          {errors.password && <p className='errorsSignup'>{errors.password.message}</p>}
        </div>
        <button type="submit">SIGN UP</button>
      </form>
      <a href="/login">Already registered ? Log In</a>
    </div>
  );
};

export default SignupForm;
