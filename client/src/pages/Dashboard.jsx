import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const [, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole('guest');
        setLoading(false);
        navigate('/');
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* Navigation Bar */}
      <nav
        style={{
          backgroundColor: '#f8f8f8',
          padding: '1rem',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup/customer')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Customer Signup
          </button>
          <button
            onClick={() => navigate('/signup/store')}
            style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
          >
            Store Owner Signup
          </button>
        </div>
        <button
          onClick={handleLogout}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Logout
        </button>
      </nav>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h1
          style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem' }}
        >
          THRIFTFINDER
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#666' }}>
          coming soon (promise)
        </p>
      </div>
    </div>
  );
}
