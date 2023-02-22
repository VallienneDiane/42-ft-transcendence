import "../styles/LoginForm.css"
import React, { useContext } from "react";
import { useForm } from "react-hook-form";
import { UserContext } from "../user/UserContext";
import { useNavigate } from "react-router-dom";
import { accountService } from "../services/account.service";
import jwt from 'jsonwebtoken';
import * as jsrsasign from 'jsrsasign';

import { Buffer } from 'buffer';
import LogInForm from "../models";
import JwtPayload from "../models";

const LoginForm: React.FC = () => {
    let navigate = useNavigate();
    let user = useContext(UserContext);
    const { register, handleSubmit } = useForm<LogInForm>();
    
    const onSubmit = (data: LogInForm) => {
        accountService.login(data)
        .then(Response => {
            accountService.saveToken(Response.data.access_token);
            // accountService.saveToken("temporarytokenthatitypedmyself18930890246c2e0ce6zcz1rce61");
            const token: string = accountService.getToken()!;
            console.log('token', token);
            const payload: JwtPayload = jsrsasign.KJUR.jws.JWS.parse(token).payloadObj!;
            console.log('payload login', payload.login);
            user.login = payload.login;
            // user.email = Response.data.email;
            navigate("/");
        })
        .catch(error => {
            console.log(error);
        });
    }
    
    return (
        <div >
            <h1>Login page</h1>
            <form className="login" onSubmit={handleSubmit(onSubmit)}> 
            <input
            {...register("login", {required: true})}
            type="text"
            placeholder="Enter your login ..."
            // name="login"
            // required
            />
            <input
            {...register("password", {required: true})}
            type="password"
            placeholder="Enter your password ..."
            // name="password"
            // required
            />
            <button type="submit">Submit</button>
            <a href="/signin">Not registered ? Sign In !</a>
        </form>
        </div>
    )
}

export default LoginForm;