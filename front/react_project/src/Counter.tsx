import { useState } from 'react'

function Counter() {
	const [count, setCount] = useState(0);
	return (
	  <div>
		Count: {count}
		<button onClick={() => setCount(0)}>Reset</button>
		<button onClick={() => setCount(count => count - 1)}>-</button>
		<button onClick={() => setCount(count => count + 1)}>+</button>
	  </div>
	);
  }

export default Counter