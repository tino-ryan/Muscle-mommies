// src/pages/auth/Login.jsx
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../firebase'; // Assuming this exports auth
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api'; // Import API_URL from api.js (fix any hardcoded typos)

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Helper function to get role and redirect
  const getRoleAndRedirect = async (uid) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/getRole`, { uid });
      const role = res.data.role;

      if (role === 'customer') {
        navigate('/customer/home');
      } else if (role === 'storeOwner') {
        navigate('/store/home');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        setError('Unknown role. Please contact support.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching role');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Login with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;

      // Get role and redirect
      await getRoleAndRedirect(uid);
    } catch (err) {
      setError('Login failed. Check your credentials. ' + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;

      // Get role and redirect
      await getRoleAndRedirect(uid);
    } catch (err) {
      setError('Google login failed: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20 }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: 10 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: 'block', width: '100%', marginBottom: 10 }}
        />
        <button type="submit" style={{ width: '100%', marginBottom: 10 }}>
          Login with Email
        </button>
      </form>
      <button onClick={handleGoogleLogin} style={{ width: '100%' }}>
        Login with Google
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
