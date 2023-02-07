import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  
  return (

    <div className="App">

      <div className="navbar">
        <ul>
          <li><a href="#">Profil</a></li>
          <li><a href="#">Game</a></li>
          <li><a href="#">Chat</a></li>
          <li><a href="#">Quit</a></li>
        </ul>
      </div>

      <div className="login">
        <input
          type="text"
          placeholder="Enter your login ..."
          name="login"
        />
        <button>Submit</button>
      </div>

    </div>
  )
}

export default App
