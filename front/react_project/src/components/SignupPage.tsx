import "../styles/SignupPage.css"
import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useNavigate } from 'react-router-dom';
import { SignInForm } from '../models'
import { accountService } from '../services/account.service';

const userSchema = yup.object().shape({
  login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
  email: yup.string().required("Email is required"),
  password: yup.string().required("Password is required") .min(8, "Password must be at least 8 characters"),
})

const SignupForm: React.FC = () => {
  let navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }} = useForm<SignInForm>({
    resolver: yupResolver(userSchema)
  });
  
  const signIn = (data: SignInForm) => {
    accountService.signIn(data)
    .then(Response => {
      accountService.saveToken(Response.data.access_token);
      navigate("/");
    })
    .catch(error => {
        console.log(error);
    });
  }

  return (
    <div id='signup_page'>
      <h1>SignUp Page</h1>
      <form className="login" onSubmit={handleSubmit(signIn)}>
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
        <a href="/login">Already registered ? Log In</a>
      </form>
    </div>
  );
};

export default SignupForm;
