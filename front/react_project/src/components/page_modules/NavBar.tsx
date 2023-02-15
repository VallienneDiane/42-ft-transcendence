import React from "react"

const NavBar: React.FC = () => {
  return (
    <div className="navbar">
    <ul>
      <li><a href="#">Profil</a></li>
      <li><a href="#">Game</a></li>
      <li><a href="#">Chat</a></li>
      <li><a href="#">Quit</a></li>
    </ul>
    </div>
  )
}

export default NavBar;