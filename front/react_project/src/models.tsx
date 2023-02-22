export default interface LogInForm {
    login: string,
    password: string,
}

export default interface SignInForm { 
    id?: number,
    login: string,
    email: string,
    password: string,
    errors?: string
  }

export default interface UserData { 
    id?: number,
    login: string,
    email: string,
    password: string,
  }

// export default LogInForm, SignInForm