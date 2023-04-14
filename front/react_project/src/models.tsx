export interface LogInForm {
    id: string,
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
    id42: string,
    login: string,
    email: string,
    avatarSvg: string
  }

  export interface AvatarSettingsForm {
    id: string,
    login: string,
    avatarSvg: string
  }

export interface User {
  id?: string,
  login: string,
  email: string,
  avatarSvg?: string
}
