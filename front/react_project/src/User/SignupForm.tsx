import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import Axios from 'axios';
import * as yup from "yup";

// Interfaces are basically a way to describe data shapes, for example, an object.
// Type is a definition of a type of data, for example, a union, primitive, intersection, tuple, or any other type.
interface defaultFormData { 
  login: string,
  email: string,
  password: string,
  errors?: string
}

const userSchema = yup.object().shape({
  login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
  email: yup.string().required("Email is required"),
  password: yup.string().required("Password is required") .min(8, "Password must be at least 8 characters"),
})

const SignupForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }} = useForm<defaultFormData>({
    resolver: yupResolver(userSchema)
  });
  
  const onSubmit = (data: defaultFormData) => {
    Axios.post('http://localhost:3000/user/signup', data);
    console.log(data);
  }

  return (
    <div>
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
    </div>
  );
};

export default SignupForm;
