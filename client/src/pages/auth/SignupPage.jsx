import { useState } from 'react';
import axios from 'axios';

function SignupPage({ role }) {
  // role = 'customer' or 'storeOwner'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle regular email/password signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await axios.post('http://localhost:3000/api/auth/signup', {
        name,
        email,
        password,
        role,
      });

      setSuccess('Signup successful! UID: ' + res.data.uid);
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    try {
      // The backend should handle Google OAuth
      const res = await axios.post(
        'http://localhost:3000/api/auth/signup/google',
        { role },
        { withCredentials: true } // if your backend uses cookies/session
      );

      setSuccess('Google signup successful! UID: ' + res.data.uid);
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
          Sign Up
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
