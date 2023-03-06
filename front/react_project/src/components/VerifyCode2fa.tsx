
import * as yup from 'yup';
import "../styles/Settings.scss"
import { useState } from "react";
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

function VerifyCode2fa() {

    const location = useLocation();
    let navigate = useNavigate();
    const [isVerified, setVerifyCode] = useState<boolean>(false);
    const [is2faActive, setActivate2fa] = useState<boolean>(false);
    const {register, handleSubmit, formState: {errors}} = useForm<VerifyCodeForm>({
        resolver: yupResolver(schema)
    });

    const verifySubmittedCode = (data: VerifyCodeForm) => {
        schema.validate(data);
        accountService.verifyCodeTwoFactorAuth(data)
        .then(response => {
            setVerifyCode(response.data.isCodeValid);
            setActivate2fa(response.data.isActive);
            if(isVerified == true) {
                console.log("dans verify code");
                const from = (location.state as any)?.from || "/";
                navigate(from);
            }
        })
        .catch(error => console.log(error));
    }
    
return (
    <div className="toggle2fa">
        <form onSubmit={handleSubmit(verifySubmittedCode)}>
        <input type="text" {...register("code")} name="code" placeholder="Enter the code"/>
        {errors.code && <p className="errorsCode">{errors.code.message}</p>}
        <button type="submit">Submit</button>
        </form>
    </div>
    )
}

export default VerifyCode2fa;