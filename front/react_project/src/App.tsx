import { useState } from 'react'
import './App.css'
import SignupForm from './page_modules/SignupForm'
import NavBar from './page_modules/NavBar'
import LoginForm from './page_modules/LoginForm'

function App() {
  const [count, setCount] = useState(0)
  
  return (

    
    <div className="App">
      {/* <NavBar/> */}
      <SignupForm/>
      {/* <LoginForm/> */}

    </div>
  )
}

export default App
