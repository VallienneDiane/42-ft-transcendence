export interface LogInForm {
    id: string,
    login: string,
    password: string
}

export interface VerifyCodeForm {
    code: string,
    id: string,
}

export interface SignUpForm { 
    login: string,
    email: string,
    password: string,
    avatarSvg: string;
  }
  
  export interface SettingsForm {
    id42: string,
    login: string,
    email: string,
    avatarSvg: string
  }

  export interface LoginSettingsForm {
    id?: string,
    login?: string,
  }

  export interface AvatarSettingsForm {
    id?: string,
    avatarSvg?: string,
  }

export interface User {
  id?: string,
  login: string,
  email: string,
  avatarSvg?: string
}
