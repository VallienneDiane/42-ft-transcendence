import React, { createElement } from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root');
const root = createRoot(container!);

interface TIS_Date {
  date : Date;
}

function Clock(date: TIS_Date) {
  return (
    <div>
      <h2>Heure : {date.date.toLocaleTimeString()}.</h2>
    </div>
  );
}

function tick() {
  root.render(<Clock date={new Date()} />);
}
  
setInterval(tick, 1000);