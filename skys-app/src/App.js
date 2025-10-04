import logo from './logo.svg';
import './App.css';
import testAPI from './components/testAPI';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Test Air Quality Widget:
          <testAPI />
        </p>
      </header>
    </div>
  );
}

export default App;
