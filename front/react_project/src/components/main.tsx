import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Error from './pages/Error'
import Header from './Header'
import '../styles/index.css'

const DomRoot = document.getElementById('root');
const Root = createRoot(DomRoot!); // ! pour forcer la possibilite que la variable soit null

function App() {
    return (
        <>
        <nav>
        <ul>
          <li><Link to="/">Login</Link></li>
          <li><Link to="/game">Home</Link></li>
        </ul>
      </nav>
        <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/game">
          <Route index element={<Home />} />
          {/* <Route path="play" element={<Play />} />
          <Route path="watch" element={<Watch />} />
          <Route path="history" element={<History />} /> */}
        </Route>
        {/* </Route>
          <Route element={<OtherLayout />}>
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
        </Route> */}
        <Route path="*" element={<Error />} />
      </Routes>
      </>
    )
}

Root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter> 
    </React.StrictMode>
);
