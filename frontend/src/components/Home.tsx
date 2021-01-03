import React from 'react';
import {
  Link
} from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <section className="section">
      <p>
        Welcome to name todo! <Link to="/user">Register an account</Link> or
        just <Link to="/logs">browse the public logs</Link>.
      </p>
    </section>
  );
}

export default Home;
