let sentence: string = `Hello, my name is ${fullName}.
 
I'll be ${age + 1} years old next month.`;

let list: Array<number> = [1, 2, 3];

// Declare a tuple type
let x: [string, number];
// Initialize it
x = ["hello", 10]; // OK

type AppProps = {
  message: string;
}; /* use `interface` if exporting so that consumers can extend */

// Easiest way to declare a Function Component; return type is inferred.
const App = ({ message }: AppProps) => <div>{message}</div>;

React.Component<PropType, StateType>


// Correct
this.setState((state, props) => ({
  counter: state.counter + props.increment
})); // pour eviter les soucis de mise a jour asynchrone

<button onClick={activateLasers}>
  Activer les lasers
</button>

function ActionLink() {
  function handleClick(e) {    e.preventDefault();    console.log('Le lien a été cliqué.');  }
  return (
    <a href="#" onClick={handleClick}>      Clique ici
    </a>
  );
}

 // Cette liaison est nécéssaire afin de permettre    // l'utilisation de `this` dans la fonction de rappel.    this.handleClick = this.handleClick.bind(this);