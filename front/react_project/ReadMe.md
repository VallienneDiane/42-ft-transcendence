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

 // Cette liaison est nécéssaire afin de permettre   
 // l'utilisation de `this` dans la fonction de rappel.    
 this.handleClick = this.handleClick.bind(this);

const numbers = [1, 2, 3, 4, 5];
const listItems = numbers.map((number) =>  <li key={number.toString()}>{number}</li>);
/ chaque élément à l’intérieur d’un appel à map() a besoin d’une clé.




// Le Contexte nous permet de transmettre une prop profondément dans l’arbre des
// composants sans la faire passer explicitement à travers tous les composants.
// Crée un contexte pour le thème (avec “light” comme valeur par défaut).
const ThemeContext = React.createContext('light');
class App extends React.Component {
  render() {
    // Utilise un Provider pour passer le thème plus bas dans l’arbre.    
    // N’importe quel composant peut le lire, quelle que soit sa profondeur.    
    // Dans cet exemple, nous passons “dark” comme valeur actuelle.    
    return (
      <ThemeContext.Provider value="dark">        <Toolbar />
      </ThemeContext.Provider>
    );
  }
}

// Un composant au milieu n’a plus à transmettre explicitement le thème
function Toolbar() {  
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

class ThemedButton extends React.Component {
  // Définit un contextType pour lire le contexte de thème actuel.  React va  
  // trouver le Provider de thème ancêtre le plus proche et utiliser sa valeur.  
  // Dans cet exemple, le thème actuel est “dark”.  
  static contextType = ThemeContext;
  render() {
    return <Button theme={this.context} />;  }
}

