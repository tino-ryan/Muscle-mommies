import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/'); // redirect to login if not logged in
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setRole(userDoc.data().role);
      } else {
        setRole('guest'); // fallback if profile not found
      }
      setLoading(false);
    };

    fetchUserRole();
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
        {/* Show links based on role */}
        {role === 'guest' && (
          <>
            <button
              onClick={() => navigate('/')}
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
