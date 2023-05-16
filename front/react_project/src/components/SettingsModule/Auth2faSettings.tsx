import * as yup from 'yup';
import { VerifyCodeForm } from "../../models";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { yupResolver } from '@hookform/resolvers/yup';
import ReactSwitch from 'react-switch';
import { accountService } from "../../services/account.service";
import { JwtPayload } from "jsonwebtoken";
import { User } from "../../models";
import { userService } from "../../services/user.service";

const schema = yup.object().shape({
    code: yup
        .string()
        .typeError('Code must be a number')
        .test('len', 'Code must be 6 characters', val => val?.length === 6)
});

const Auth2faSettings: React.FC = () => {
    let decodedToken: JwtPayload = accountService.readPayload()!;
    const id = decodedToken.sub;
    const [checked, setchecked] = useState<boolean>(false);
    const [qrcode, setQrcode] = useState<string>("null");
    const [qrLoad, setQrLoad] = useState<boolean>(false)
    const [is2faActive, setActivate2fa] = useState<boolean>(false);
    const [errorCode, setErrorCode] = useState<boolean>(false);
    const [user, setUser] = useState<User>();

    const { register, handleSubmit, formState: { errors } } = useForm<VerifyCodeForm>({
        resolver: yupResolver(schema)
    });

    const isGoogleAuthActivate = () => {
        accountService.is2faActiveSettings(id!)
            .then(response => {
                setActivate2fa(response.data.is2faActive);
                setchecked(response.data.is2faActive);
                setQrcode(response.data.qrcode);
                setErrorCode(false);
            })
            .catch(error => console.log(error));
    }

    useEffect(() => {
        isGoogleAuthActivate();
        userService.getUser(id!)
            .then(response => {
                setUser(response.data);
            })
            .catch(error => {
                console.log(error);
            });
        }, [])
        
    const verifySubmittedCode = (data: VerifyCodeForm) => {
        schema.validate(data);
        accountService.verifyCode2faSettings(data)
        .then(response => {
            console.log("auth2fa verifysubmitcode settings ? bool ", response);
            setActivate2fa(response.data.is2faActive);
        })
        .catch(error => {
            setErrorCode(true);
            console.log(error);
        });
    }

    const handleChange = (value: boolean) => {
        setchecked(!checked);
        if (value == true) {
            accountService.enable2fa()
            .then(response => {
                setQrcode(response.data.qrcode);
                setQrLoad(true);
            })
            .catch(error => console.log(error));
        }
        if (value == false) {
            accountService.disable2fa()
            .then(response => {
                setActivate2fa(response.data.is2faActive);
                setQrLoad(false);
            })
            .catch(error => console.log(error));
        }
    }

    return (
        <div id="fasetting">
            <h2>Activate Two-Factor-Auth</h2>
            <div className="switch">
                <p>Activate Google Authentificator</p>
                <ReactSwitch
                    className="checkBox"
                    checked={checked}
                    onChange={handleChange}
                />
            </div >
            <div id="auth2fa">
                {checked === true && qrLoad ? <img id="qrcode" src={qrcode} alt="" /> : null}
                {checked === true && qrLoad && (is2faActive == false || is2faActive == null) ?
                <div>
                    <p id="scan">Scan the QRCode in your application </p>
                    <form onSubmit={handleSubmit(verifySubmittedCode)}>
                        <input type="text" {...register("code")} name="code" placeholder="Enter the code" />
                        <div id="validateForm">
                            {errors.code && <p className="errors">{errors.code.message}</p>}
                            {errorCode ? <p className="errors">Wrong code entered</p> : null}
                            <button type="submit">Submit</button>
                        </div>
                    </form>
                </div> : null}
            {checked === true && is2faActive == true ? <p id="AuthActivate">Google Authentificator is activate</p> : null}
            </div>
        </div>
    )
}

export default Auth2faSettings;