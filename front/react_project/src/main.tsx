import React from 'react'
import { useState, useEffect, } from 'react'
import ReactDOM from 'react-dom'
import { createRoot } from 'react-dom/client'

const container = document.getElementById('root');
const root = createRoot(container!);

interface Img {
  url: string,
  alt: string
}

interface User {
  name: string,
  date: Date,
  img: Img
};

const michel: User = {
  name: "Michel",
  date: new Date(),
  img: {
    url: "NaN",
    alt: "a fish"
  }
};

function formatDate(date: Date) {
  return (
    <h2>{date.toLocaleDateString()}</h2>
  )
}

function Avatar(props: Img) {
  return (
    <img className="Avatar"
      src={props.url}
      alt={props.alt}
    />
  );
}

function UserInfo(props: Img) {
  return (
    <div className="UserInfo">
      <Avatar url={props.url} alt={props.alt}/>
      <div className="UserInfo-name">
        {props.alt}
      </div>
    </div>
  );
}

function Comment(props: User) {
  return (
    <div className="Comment">
      <UserInfo url={props.img.url} alt={props.img.alt} />
      <div className='Comment-text'>
        {props.name}
      </div>
      <div className='Comment-date'>
        {formatDate(props.date)}
      </div>
    </div>
  );
}

root.render(<Comment name={michel.name} date={michel.date} img={michel.img} />);