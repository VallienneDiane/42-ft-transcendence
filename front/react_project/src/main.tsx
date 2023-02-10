import React from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'
//import App from './App'
//import './index.css'

interface Txt {
  content: string;
  grade: number;
}

function composeTxt(txt: Txt) {
  return txt.content + ' has grade ' + txt.grade;
}

const txt: Txt = {content: 'dd', grade: 8};

const element = <h1>blbl, {composeTxt(txt)}</h1>
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(element);