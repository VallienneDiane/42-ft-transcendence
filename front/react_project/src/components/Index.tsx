import React from 'react'
import ReactDOM from 'react-dom'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home'
import Error from './pages/Error'
import Header from './components/Header/Index'
 
ReactDOM.render(
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
                <Route path="/params">
                    <Params />
                </Route>
                <Route path="/profil">
                    <Profil />
                </Route>
                <Route>
                    <Error />
                </Route>
            </Switch>
        </Router>
    </React.StrictMode>,
document.getElementById('root')
)
