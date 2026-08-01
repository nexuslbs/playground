import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
        const data = await api(`/movies${q}`);
        if (!cancelled) {
          setMovies(data.movies);
          setError('');
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <div className="home">
      <div className="search-row">
        <input
          type="text"
          placeholder="Search movies by title, genre or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="count">{loading ? '…' : `${movies.length} movies`}</span>
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="loading">Loading movies…</div>
      ) : (
        <div className="movie-grid">
          {movies.map((m) => (
            <div className="movie-card" key={m.id}>
              <div className="card-top">
                <span className="rating">★ {m.rating.toFixed(1)}</span>
                <span className="year">{m.year}</span>
              </div>
              <h3>{m.title}</h3>
              <span className="genre">{m.genre}</span>
              <p className="desc">{m.description}</p>
              <span className="id">#{m.id}</span>
            </div>
          ))}
          {!loading && movies.length === 0 && (
            <div className="empty">No movies match “{search}”.</div>
          )}
        </div>
      )}
    </div>
  );
}
