import "../styles/Settings.scss"
import * as yup from 'yup';
import { VerifyCodeForm } from "../models";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { yupResolver } from '@hookform/resolvers/yup';
import ReactSwitch from 'react-switch';
import { accountService } from "../services/account.service";

const schema = yup.object().shape({
  code: yup
  .string()
  .typeError('Code must be a number')
  .test('len', 'Code must be 6 characters', val => val?.length === 6)
});

export default function Settings() {
  const [checked, setchecked] = useState<boolean>(false);
  const [isVerified, setVerifyCode] = useState<boolean>(false);
  const [qrcode, setQrcode] = useState<string>("null");
  const [is2faActive, setActivate2fa] = useState<boolean>(false);
  const {register, handleSubmit, formState: {errors}} = useForm<VerifyCodeForm>({
    resolver: yupResolver(schema)
  });

  const isGoogleActivate = () => {
    accountService.isGoogleAuthActivated()
    .then(response => {
      setActivate2fa(response.data.isActive);
      setchecked(response.data.isActive);
    })
    .catch(error => console.log(error));
  }
  
  useEffect(() => {
    isGoogleActivate();
  }, [])

  const verifySubmittedCode = (data: VerifyCodeForm) => {
    schema.validate(data);
    accountService.verifyCodeTwoFactorAuth(data)
    .then(response => {
      setVerifyCode(response.data.isCodeValid);
      setActivate2fa(response.data.isActive);
    })
    .catch(error => console.log(error));
  }
  
  const handleChange = (value: boolean) => {
    setchecked(!checked);
    if(value == true) {
      accountService.enableTwoFactorAuth()
      .then(response => {
        setQrcode(response.data.qrcode);
      })
      .catch(error => console.log(error));
    }
    if (value == false) {
      accountService.disableTwoFactorAuth()
      .then(response => {
        setActivate2fa(response.data);
      })
      .catch(error => console.log(error));
    }
  }

  if(checked == false && is2faActive == false)
    return (
      <div className="toggle2fa">
      <div className="switch">
        <p>Activate Google Authentificator</p>
        <ReactSwitch
          checked={checked}
          onChange={handleChange}
        />
      </div>
    </div>
  )
  return (
    <div className="toggle2fa">
      <div className="switch">
        <p>Activate Google Authentificator</p>
        <ReactSwitch
          checked={checked}
          onChange={handleChange}
        />
      </div>
        <p>Scan the QRCode in your application </p>
        <img id="qrcode" src={qrcode} alt="" />
        <form onSubmit={handleSubmit(verifySubmittedCode)}>
        <input type="text" {...register("code")} name="code" placeholder="Enter the code"/>
        {errors.code && <p className="errorsCode">{errors.code.message}</p>}
        <button type="submit">Submit</button>
        </form>
    </div>
  )
}