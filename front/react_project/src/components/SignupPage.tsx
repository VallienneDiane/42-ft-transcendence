import "../styles/LoginPage.scss"
import React, { useContext, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useNavigate } from 'react-router-dom';
import { SignUpForm } from '../models'
import { accountService } from '../services/account.service';
import { generateRandomAvatarOptions } from "../assets/avatarGenerator";

const userSchema = yup.object().shape({
  login: yup.string().required("Login is required") .min(3, "Login must be at least 3 characters"),
  email: yup.string().required("Email is required"),
  password: yup.string().required("Password is required") .min(8, "Password must be at least 8 characters"),
})

const SignupPage: React.FC = () => {
  let navigate = useNavigate();
  const [errorLogin, setError] = useState<boolean>(false);
  
  const { register, handleSubmit, formState: { errors }} = useForm<SignUpForm>({
    resolver: yupResolver(userSchema)
  });

  const signUp = async (data: SignUpForm) => {
    const avatar = generateRandomAvatarOptions();
    const svgString = ReactDOMServer.renderToString(avatar);

    data.avatarSvg = 'data:image/svg+xml,' + encodeURIComponent(svgString);
    await accountService.isUniqueLogin(data.login)
    .then(loginUnique => {
      if(loginUnique.data == true) {
        accountService.signUp(data)
        .then(Response => {
          accountService.saveToken(Response.data.access_token);
          navigate("/");
        })
        .catch(error => {console.log(error);})
      }
      else {
        setError(true);
      }
    })
    .catch(error=> {console.log(error);})
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
            {errors.login && <p className='logError'>{errors.login.message}</p>}   {/* optionnal fields : errors */}
            <input className="form_element" 
            {...register("email")}
            type="email" 
            placeholder="Email"
            />
            {errors.email && <p className='logError'>{errors.email.message}</p>}
            <input className="form_element" 
            {...register("password")}
            type="password" 
            placeholder="Password"
            />
            {errors.password && <p className='logError'>{errors.password.message}</p>}
          <button className="form_element" type="submit">SIGN UP</button>
            {errorLogin ? <p className="error">This login already exist, choose another one</p> : null}
        </form>
        <a href="/login">Already registered ? Log In</a>
      </div>
    </div>
  );
};

export default SignupPage;
