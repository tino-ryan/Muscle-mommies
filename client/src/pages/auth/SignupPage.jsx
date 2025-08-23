// src/pages/auth/SignupPage.jsx
import { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth'; // Add signInWithEmailAndPassword
import { auth } from '../../firebase'; // Assuming this exports auth
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../api'; // Import API_URL from api.js

function SignupPage({ role }) {
  // role = 'customer' or 'storeOwner'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Helper to navigate based on role after success
  const navigateToHome = () => {
    if (role === 'customer') {
      navigate('/customer/home');
    } else if (role === 'storeOwner') {
      navigate('/store/home');
    }
  };

  // Handle regular email/password signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(`${API_URL}/api/auth/signup`, {
        name,
        email,
        password,
        role,
      });

      setSuccess('Signup successful! UID: ' + res.data.uid);

      // Auto-login after signup
      await signInWithEmailAndPassword(auth, email, password);

      // Navigate to appropriate home
      navigateToHome();
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    setError('');
    setSuccess('');
    const provider = new GoogleAuthProvider();

    try {
      // Sign in with Google popup
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      // Send to backend with role
      const res = await axios.post(`${API_URL}/api/auth/signup/google`, {
        idToken,
        role,
      });

      setSuccess('Google signup successful! UID: ' + res.data.uid);

      // Navigate to appropriate home
      navigateToHome();
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '1rem' }}>
      <h2>{role === 'customer' ? 'Customer Signup' : 'Store Owner Signup'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={{
            display: 'block',
            marginBottom: '1rem',
            width: '100%',
            padding: '0.5rem',
          }}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            display: 'block',
            marginBottom: '1rem',
            width: '100%',
            padding: '0.5rem',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            display: 'block',
            marginBottom: '1rem',
            width: '100%',
            padding: '0.5rem',
          }}
        />
        <button
          type="submit"
          style={{ padding: '0.5rem 1rem', marginRight: '1rem' }}
        >
          Sign Up with Email
        </button>
        <button type="button" onClick={handleGoogleSignup}>
          Sign Up with Google
        </button>
      </form>

      {success && (
        <p style={{ color: 'green', marginTop: '1rem' }}>{success}</p>
      )}
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
    </div>
  );
}

export default SignupPage;
