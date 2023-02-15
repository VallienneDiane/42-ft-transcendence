import React from 'react'
import ReactDOM from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import App from './App'
import Test from './test'
import './styles/index.css'

const DomRoot = document.getElementById('root');
const Root = createRoot(DomRoot!); // ! pour forcer la possibilite que la variable soit null

Root.render(<App firstName='Clem' lastName='Cartet' />);

const DomSquare = document.getElementById('square');
const Squaree = createRoot(DomSquare!); // ! pour forcer la possibilite que la variable soit null

Squaree.render(
<div>
<Test />
</div>);