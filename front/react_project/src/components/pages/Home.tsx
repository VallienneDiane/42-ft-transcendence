import React from 'react'
import { BrowserRouter as Route, Switch, useRouteMatch } from 'react-router-dom'

function Home() {
    let { path } = useRouteMatch()
    return (
        <div>
            <h1>Acceuil Game</h1>
            <Switch>
                <Route exact path={`${path}/play`}>
                    <Play />
                </Route>
                <Route exact path={`${path}/watch`}>
                    <Watch />
                </Route>
                <Route exact path={`${path}/history`}>
                    <History />
                </Route>
            </Switch>
        </div>
    )
}

export default Home