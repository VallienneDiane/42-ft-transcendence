import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Login from './components/pages/Login'
import Home from './components/pages/Home'
import Error from './components/pages/Error'
import Header from './components/Header'
import './styles/index.css'

const DomRoot = document.getElementById('root');
const Root = createRoot(DomRoot!); // ! pour forcer la possibilite que la variable soit null

Root.render(
    <React.StrictMode>
        <Router>
            <Header />
            <Switch>
                <Route exact path="/">
                    <Login />
                </Route>
                <Route path="/game">
                    <Home />
                </Route>
                {/* <Route path="/params">
                    <Params />
                </Route>
                <Route path="/profil">
                    <Profil />
                </Route> */}
                <Route>
                    <Error />
                </Route>
            </Switch>
        </Router>
    </React.StrictMode>
);
