
import * as yup from 'yup';
import "../styles/Settings.scss"
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
    const login = location.state?.login;
    let navigate = useNavigate();
    const {register, handleSubmit, formState: {errors}} = useForm<VerifyCodeForm>({
        resolver: yupResolver(schema)
    });

    const verifySubmittedCode = (data: VerifyCodeForm) => {
        data.login = login;
        schema.validate(data);
        accountService.verifyCodeTwoFactorAuth(data)
        .then(response => {
            if(response.data.isCodeValid == true) {
                accountService.generateToken(login)
                .then(response_token => {
                    accountService.saveToken(response_token.data.access_token);
                    navigate('/');
                })
                .catch(error => {
                    console.log(error);
                });
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