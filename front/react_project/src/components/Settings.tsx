import "../styles/Settings.scss"
import * as yup from 'yup';
import { VerifyCodeForm } from "../models";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { yupResolver } from '@hookform/resolvers/yup';
import ReactSwitch from 'react-switch';
import { accountService } from "../services/account.service";
import { JwtPayload } from "jsonwebtoken";

const schema = yup.object().shape({
  code: yup
  .string()
  .typeError('Code must be a number')
  .test('len', 'Code must be 6 characters', val => val?.length === 6)
});

export default function Settings() {

  let decodedToken: JwtPayload = accountService.readPayload()!;
  const [checked, setchecked] = useState<boolean>(false);
  const [qrcode, setQrcode] = useState<string>("null");
  const [is2faActive, setActivate2fa] = useState<boolean>(false);
  const {register, handleSubmit, formState: {errors}} = useForm<VerifyCodeForm>({
    resolver: yupResolver(schema)
  });

  // console.log("SETTINGS PARAMS 1 : checked ", checked, "is2faactive ", is2faActive, " & qrcode", qrcode);
  const isGoogleActivate = () => {
    accountService.is2faActiveSettings(decodedToken.login)
    .then(response => {
      setActivate2fa(response.data.is2faActive);
      setchecked(response.data.is2faActive);
      setQrcode(response.data.qrcode);
    })
    .catch(error => console.log(error));
  }
  
  useEffect(() => {
    isGoogleActivate();
  }, [])
  
  console.log("SETTINGS PARAMS 2: checked ", checked, "is2faactive ", is2faActive, " & qrcode", qrcode);
  const verifySubmittedCode = (data: VerifyCodeForm) => {
    schema.validate(data);
    accountService.verifyCode2faSettings(data)
    .then(response => {;
      setActivate2fa(response.data.is2faActive);
    })
    .catch(error => console.log(error));
  }
  
  const handleChange = (value: boolean) => {
    setchecked(!checked);
    if(value == true) {
      accountService.enable2fa()
      .then(response => {
        setQrcode(response.data.qrcode);
      })
      .catch(error => console.log(error));
    }
    if (value == false) {
      accountService.disable2fa()
      .then(response => {
        setActivate2fa(response.data.is2faActive);
      })
      .catch(error => console.log(error));
    }
  }

  if(checked == true && (is2faActive == false || is2faActive == null))
  return (
    <div className="toggle2fa">
      <div className="switch">
        <p>Activate Google Authentificator</p>
        <ReactSwitch
          className="checkBox"
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
  if(checked == true && is2faActive == true)
  return (
    <div className="toggle2fa">
      <div className="switch">
        <p>Activate Google Authentificator</p>
        <ReactSwitch
          className="checkBox"
          checked={checked}
          onChange={handleChange}
        />
      </div>
        <img id="qrcode" src={qrcode} alt="" />
        <p id="AuthActivate">Google Authentificator is activate</p>
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
  </div>
  )
}