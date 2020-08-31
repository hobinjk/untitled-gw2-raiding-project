import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import LogsView from './components/LogsView';

function App() {
  return (
    <Router>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/">Home</Link>

          <a role="button" className="navbar-burger burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div className="navbar-menu">
          <div className="navbar-start">
            <Link className="navbar-item" to="/logs">Logs</Link>
          </div>
        </div>
      </nav>

      <main>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/logs">
            <LogsView />
          </Route>
        </Switch>
      </main>
    </Router>
  );
}

export default App;
