import React from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/Login'
import Home from './pages/Home-test'
import Error from './pages/Error'
import Header from './Header'
import '../styles/index.css'

const DomRoot = document.getElementById('root');
const Root = createRoot(DomRoot!); // ! pour forcer la possibilite que la variable soit null

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
        errorElement: <Error />,
        // loader: rootLoader,
    },
    {
        path: "/game",
        element: <Home />,
        // children: [ // nested routes
        //     {
        //         path: "/chat",
        //         element: <Chat />,
        //     },
        // ],
    },
]);

Root.render(
    <React.StrictMode>
        <RouterProvider router={router} />
    </React.StrictMode>
);

//     <BrowserRouter>
//         <Router>
//             <Header />
//             <Switch>
//                 <Route exact path="/">
//                     <Login />
//                 </Route>
//                 <Route path="/game">
//                     <Home />
//                 </Route>
//                 {/* <Route path="/params">
//                     <Params />
//                 </Route>
//                 <Route path="/profil">
//                     <Profil />
//                 </Route> */}
//                 <Route>
//                     <Error />
//                 </Route>
//             </Switch>
//         </Router>
//     </BrowserRouter>
// );
