import logo from './logo.svg';
import './App.css';
import AirQualityWidget from './components/AirQualityWidget';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Test Air Quality Widget:
          <AirQualityWidget />
        </p>
      </header>
    </div>
  );
}

export default App;
