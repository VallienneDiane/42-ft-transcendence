import { useState, useEffect, } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'

function SendQuality(content: string, grade: number) {
  var formData = new FormData();
  formData.append('content', JSON.stringify(content));
  formData.append('grade', JSON.stringify(grade));
  fetch('localhost:3000/johnboule', {
    method: 'POST',
    mode: 'cors',
    body: formData
})
}

function tick() {
  const element = (
    <div>
      <h1>Bonjour, monde !</h1>
      <h2>Il est {new Date().toLocaleTimeString()}.</h2>
    </div>
  );
  HTMLElement.render(
    element,
    document.getElementById('HTMLElement')
  );
}

setInterval(tick, 1000);

function App() {
  const [count, setCount] = useState(0);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    console.log('qualities :\n');
    fetch('localhost:3000/johnboule/qualities')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setPosts(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div>
        <form action="localhost:3000/johnboule" method="POST">
          <label>content of quality
            <input name="content" type="string" />
          </label>
          <br/>
          <label>grade level
            <input name="grade" type="number" />
          </label>
          <button onClick={() => SendQuality(content, grade)}>Send quality</button>
        </form>
      </div>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <div>
        <Clock />
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}

export default App
