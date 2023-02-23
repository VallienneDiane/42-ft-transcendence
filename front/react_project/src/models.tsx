export interface LogInForm {
    login: string,
    password: string
}

export interface SignUpForm { 
    id?: number,
    login: string,
    email: string,
    password: string,
    errors?: string
  }

export interface UserData { 
    id?: number,
    login: string,
    email: string,
    password: string
  }

export interface JwtPayload {
  login: string,
  sub: number,
  iat: number,
  exp: number
}

export interface User {
  token: string,
  id?: number,
  login: string,
  email: string,
  password: string
}

// export LogInForm, SignUpForm