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
import LogView from './components/LogView';
import LeaderboardView from './components/LeaderboardView';
import UploadView from './components/UploadView';
import UserView from './components/UserView';
import API from './API';

function App() {
  function toggleBurgerMenu() {
    let navbarMenu = document.querySelector('.navbar-menu');
    if (navbarMenu) {
      navbarMenu.classList.toggle('is-active');
    }
  }

  return (
    <Router>
      <nav className="navbar" role="navigation" aria-label="main navigation">
        <div className="navbar-brand">
          <Link className="navbar-item" to="/">Home</Link>

          <a role="button" className="navbar-burger" aria-label="menu"
             aria-expanded="false" data-target="navbarLogs"
             onClick={toggleBurgerMenu}>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </a>
        </div>
        <div id="navbarLogs" className="navbar-menu">
          <div className="navbar-start">
            <Link className="navbar-item" to="/logs">Public Logs</Link>
            {API.isLoggedIn() &&
              <Link className="navbar-item" to="/logs?personal=true">Personal Logs</Link>
            }
            <Link className="navbar-item" to="/leaderboard">Leaderboard</Link>
            {API.isLoggedIn() && (<>
              <Link className="navbar-item" to="/upload">Upload</Link>
              <Link className="navbar-item" to="/user">Profile</Link>
            </>)}
            {!API.isLoggedIn() &&
              <Link className="navbar-item" to="/user">Log In/Create Account</Link>
            }
          </div>
        </div>
      </nav>

      <main>
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/logs/:logId">
            <LogView />
          </Route>
          <Route path="/logs">
            <LogsView />
          </Route>
          <Route path="/leaderboard">
            <LeaderboardView />
          </Route>
          <Route path="/upload">
            <UploadView />
          </Route>
          <Route path="/user">
            <UserView />
          </Route>
        </Switch>
      </main>
    </Router>
  );
}

export default App;
