import "../styles/LoginPage.scss"
import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useNavigate } from 'react-router-dom';
import { SignUpForm } from '../models'
import { accountService } from '../services/account.service';
import Avatar from 'avataaars';
import { generateRandomAvatarOptions } from "../assets/avatarGenerator";


const userSchema = yup.object().shape({
  login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
  email: yup.string().required("Email is required"),
  password: yup.string().required("Password is required") .min(8, "Password must be at least 8 characters"),
})

const SignupPage: React.FC = () => {
  let navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }} = useForm<SignUpForm>({
    resolver: yupResolver(userSchema)
  });
  
  const signUp = (data: SignUpForm) => {
    const avatarElement = document.createElement('div');
    ReactDOM.render(
      <Avatar
        style={{ width: '100px', height: '100px' }}
        avatarStyle='Circle'
        {...generateRandomAvatarOptions()}
        />,
        avatarElement
    )
    console.log('avatarElement', avatarElement.innerHTML);
    data.avatarSvg = avatarElement.innerHTML;
    accountService.signUp(data)
    .then(Response => {
      accountService.saveToken(Response.data.access_token);
      // accountService.enable2fa();
      navigate("/");
    })
    .catch(error => {
        console.log(error);
    });
  }

  return (
    <div id='signup_page'>
      <div className="card">
        <h1>SignUp Page</h1>
        <form className="login" onSubmit={handleSubmit(signUp)}>
            <input className="form_element" 
            {...register("login")}
            type="text" 
            placeholder="Login"
            />
            {errors.login && <p className='errorsSignup'>{errors.login.message}</p>}   {/* optionnal fields : errors */}
            <input className="form_element" 
            {...register("email")}
            type="email" 
            placeholder="Email"
            />
            {errors.email && <p className='errorsSignup'>{errors.email.message}</p>}
            <input className="form_element" 
            {...register("password")}
            type="password" 
            placeholder="Password"
            />
            {errors.password && <p className='errorsSignup'>{errors.password.message}</p>}
          <button className="form_element" type="submit">SIGN UP</button>
        </form>
        <a href="/login">Already registered ? Log In</a>
      </div>
    </div>
  );
};

export default SignupPage;
