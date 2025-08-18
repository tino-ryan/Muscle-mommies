import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole('guest');
        setLoading(false);
        navigate('/');
        return;
      }

      try {
        // Fetch user role from backend API
        const res = await fetch(`${API_URL}/api/users/${user.uid}`);
        if (!res.ok) throw new Error('Failed to fetch user role');

        const userData = await res.json();
        setRole(userData.role || 'guest');
      } catch (err) {
        console.error('Error fetching user role:', err);
        setRole('guest');
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
    <div style={{ padding: 20, maxWidth: 600, margin: '0 auto' }}>
      <h1>Welcome to your Dashboard 🎉</h1>

      <div style={{ marginTop: 20 }}>
        {role === 'guest' && (
          <>
            <button
              onClick={() => navigate('/login')}
              style={{ marginRight: 10, padding: '0.5rem 1rem' }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup/customer')}
              style={{ marginRight: 10, padding: '0.5rem 1rem' }}
            >
              Customer Signup
            </button>
            <button
              onClick={() => navigate('/signup/store')}
              style={{ padding: '0.5rem 1rem' }}
            >
              Store Owner Signup
            </button>
          </>
        )}

        {role === 'customer' && (
          <button
            onClick={() => navigate('/customer/home')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Go to Customer Home
          </button>
        )}

        {role === 'storeOwner' && (
          <button
            onClick={() => navigate('/store/home')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Go to Store Home
          </button>
        )}

        {role === 'admin' && (
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{ padding: '0.5rem 1rem' }}
          >
            Go to Admin Dashboard
          </button>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        <button onClick={handleLogout} style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </div>
    </div>
  );
}
