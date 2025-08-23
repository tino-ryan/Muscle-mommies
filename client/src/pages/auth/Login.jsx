// src/pages/auth/Login.jsx
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_URL = 'https://muscle-mommies-server.onrender.com';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const getRoleAndRedirect = async (uid) => {
    try {
      console.log('Fetching role for UID:', uid);
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
      console.error('Role fetch error:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Retry login to handle potential propagation delays
      let attempts = 3;
      while (attempts > 0) {
        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          const uid = userCredential.user.uid;
          console.log('Login successful, UID:', uid);
          await getRoleAndRedirect(uid);
          return;
        } catch (loginErr) {
          attempts--;
          if (attempts === 0) throw loginErr;
          console.log('Retrying login, attempts left:', attempts);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s
        }
      }
    } catch (err) {
      setError(`Login failed: ${err.code} - ${err.message}`);
      console.error('Login error:', err.code, err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      console.log('Google login successful, UID:', uid);
      await getRoleAndRedirect(uid);
    } catch (err) {
      setError(`Google login failed: ${err.code} - ${err.message}`);
      console.error('Google login error:', err.code, err.message);
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
