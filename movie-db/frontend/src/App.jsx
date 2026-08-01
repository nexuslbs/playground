import { useState } from 'react';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import ResetPassword from './pages/ResetPassword.jsx';

const NAV = [
  { key: 'home', label: 'Movies' },
  { key: 'register', label: 'Register' },
  { key: 'reset', label: 'Reset Password' },
];

export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="app">
      <header className="navbar">
        <span className="brand" onClick={() => setView('home')}>🎬 MovieDB</span>
        <nav>
          {NAV.map((item) => (
            <button
              key={item.key}
              className={view === item.key ? 'nav-link active' : 'nav-link'}
              onClick={() => setView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {view === 'home' && <Home />}
        {view === 'register' && <Register />}
        {view === 'reset' && <ResetPassword />}
      </main>

      <footer className="footer">
        MovieDB · Go REST API + React (Vite) + PostgreSQL · DEV mode demo
      </footer>
    </div>
  );
}
