export interface LogInForm {
    login: string,
    password: string
}

export interface VerifyCodeForm {
    login?: string,
    code: string,
    errors?:string,
}

export interface SignUpForm { 
    login: string,
    email: string,
    password: string,
  }
  
  export interface SettingsForm {
    id42: number,
    login: string,
    email: string,
    avatarSvg: string
}

export interface User {
  id?: number,
  login: string,
  email: string,
  avatarSvg?: string
}
