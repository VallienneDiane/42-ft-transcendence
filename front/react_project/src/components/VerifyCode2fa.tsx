import * as yup from 'yup';
import "../styles/VerifyCode2fa.scss"
import React, { useState } from 'react';
import { VerifyCodeForm } from "../models";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { yupResolver } from '@hookform/resolvers/yup';
import { accountService } from "../services/account.service";

const schema = yup.object().shape({
    code: yup
    .string()
    .typeError('Code must be a number')
    .test('len', 'Code must be 6 characters', val => val?.length === 6)
});

const VerifyCode2fa:React.FC = () => {
    
    const location = useLocation();
    const id = location.state?.id;
    let navigate = useNavigate();
    const [errorCode, setErrorCode] = useState<boolean>(false);
    const {register, handleSubmit, formState: {errors}} = useForm<VerifyCodeForm>({
        resolver: yupResolver(schema)
    });
    
    const verifySubmittedCode = (data: VerifyCodeForm) => {
        data.id = id;
        schema.validate(data);
        accountService.verifyCode2fa(data)
        .then(response => {
            if(response.data.isCodeValid == true) {
                accountService.generateToken(id)
                .then(response_token => {
                    accountService.saveToken(response_token.data.access_token);
                    navigate('/');
                })
                .catch(error => {
                    console.log(error);
                });
            }
        })
        .catch(error => {
            setErrorCode(true);
            console.log(error);
        });
    }
    
return (
    <div className="verifycode">
        <div>
            <form onSubmit={handleSubmit(verifySubmittedCode)}>
            <h2>Check your Google Authentificator application</h2>
                <input type="text" {...register("code")} name="code" placeholder="Enter the code"/>
                {errors.code && <p className="errors">{errors.code.message}</p>}
                {errorCode ? <p className="errors">Wrong code entered</p> : null}
                <button type="submit">Submit</button>
            </form>
        </div>
    </div>
    )
}

export default VerifyCode2fa;