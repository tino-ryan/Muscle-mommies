import { useEffect, useState, useMemo } from 'react'; // Add useMemo import
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomLoading from '../../components/CustomLoading';
import { API_URL } from '../../api';
import '../../styles/signup.css';

export default function SignupPage({ role }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('vintage');
  const [currentImage, setCurrentImage] = useState(() => {
    const initialTheme = [
      {
        name: 'vintage',
        images: ['/images/themes/vintage.jpg'],
        taglines: [
          'Retro vibes, timeless finds.',
          'Classic looks for modern days.',
        ],
      },
    ];
    return initialTheme[0].images[
      Math.floor(Math.random() * initialTheme[0].images.length)
    ];
  });
  const [currentTagline, setCurrentTagline] = useState(() => {
    const initialTheme = [
      {
        name: 'vintage',
        taglines: [
          'Retro vibes, timeless finds.',
          'Classic looks for modern days.',
        ],
      },
    ];
    return initialTheme[0].taglines[
      Math.floor(Math.random() * initialTheme[0].taglines.length)
    ];
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [swipeIn, setSwipeIn] = useState(true);
  const navigate = useNavigate();

  const themes = useMemo(
    () => [
      {
        name: 'vintage',
        bg: '#faf0e6',
        text: '#4b3621',
        buttonBg: '#8b5e3c',
        buttonHover: '#6b4a2e',
        font: "'Playfair Display', serif",
        inputBorder: '#a67c00',
        themeIcon: 'fa-camera-retro',
        images: ['/images/themes/vintage.jpg'],
        taglines: [
          'Retro vibes, timeless finds.',
          'Classic looks for modern days.',
        ],
      },
      {
        name: 'goth',
        bg: '#0f0f0f',
        text: '#f0f0f0',
        buttonBg: '#1c2526',
        buttonHover: '#2e3b3e',
        font: "'Cinzel', serif",
        inputBorder: '#e600ac',
        themeIcon: 'fa-skull',
        images: ['/images/themes/goth.jpg'],
        taglines: ['Dark style, bold attitude.', 'Mystery meets fashion.'],
        taglineBg: 'rgba(255, 255, 255, 0.3)',
      },
      {
        name: 'y2k',
        bg: '#e0bbff',
        text: '#3f0071',
        buttonBg: '#ff00ff',
        buttonHover: '#cc00cc',
        font: "'Orbitron', sans-serif",
        inputBorder: '#3f0071',
        themeIcon: 'fa-radio',
        images: ['/images/themes/y2k.jpg', '/images/themes/y2k2.jpg'],
        taglines: [
          'Y2K flair, neon everywhere.',
          'Turn back the millennial clock.',
        ],
      },
      {
        name: 'hiphop',
        bg: '#fef6e4',
        text: '#1f2937',
        buttonBg: '#1f2937',
        buttonHover: '#374151',
        font: "'Bebas Neue', sans-serif",
        inputBorder: '#1f2937',
        themeIcon: 'fa-microphone',
        images: [
          '/images/themes/hiphop1.jpg',
          '/images/themes/hiphop2.jpg',
          '/images/themes/hiphop3.jpg',
        ],
        taglines: ['Street beats, fresh fits.', 'Urban culture, urban style.'],
      },
      {
        name: 'sporty',
        bg: '#e3f2fd',
        text: '#1e88e5',
        buttonBg: '#1e88e5',
        buttonHover: '#1565c0',
        font: "'Montserrat', sans-serif",
        inputBorder: '#1e88e5',
        themeIcon: 'fa-dumbbell',
        images: ['/images/themes/sporty.jpg', '/images/themes/sporty2.jpg'],
        taglines: ['Active life, stylish gear.', 'Run, play, slay.'],
      },
    ],
    []
  );

  // Preload all images
  useEffect(() => {
    themes.forEach((theme) => {
      theme.images.forEach((image) => {
        const img = new Image();
        img.src = image;
      });
    });
  }, [themes]); // Add 'themes' to the dependency array

  // Theme cycling with random image and tagline
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % themes.length;
      const theme = themes[idx];
      const randomImage =
        theme.images[Math.floor(Math.random() * theme.images.length)];
      const randomTagline =
        theme.taglines[Math.floor(Math.random() * theme.taglines.length)];
      setCurrentTheme(theme.name);
      setCurrentImage(randomImage);
      setCurrentTagline(randomTagline);
    }, 6000);

    return () => clearInterval(interval);
  }, [themes]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Swipe-in animation on mount
  useEffect(() => {
    setTimeout(() => setSwipeIn(false), 1200); // Match swipe-out duration
  }, []);

  // Handle regular email/password signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

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
      if (role === 'customer') {
        navigate('/customer/home');
      } else if (role === 'storeOwner') {
        navigate('/store/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google signup
  const handleGoogleSignup = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await axios.post(`${API_URL}/api/auth/signup/google`, {
        idToken,
        role,
      });

      setSuccess('Google signup successful! UID: ' + res.data.uid);

      if (role === 'customer') {
        navigate('/customer/home');
      } else if (role === 'storeOwner') {
        navigate('/store/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  const themeData = themes.find((t) => t.name === currentTheme);

  return (
    <div
      className={`signup-container ${isMobile ? 'mobile' : ''} ${swipeIn ? 'swipe-in' : ''}`}
      style={{
        backgroundColor: isMobile ? 'transparent' : themeData.bg,
        backgroundImage: isMobile ? `url(${currentImage})` : 'none',
        backgroundSize: isMobile ? 'cover' : 'auto',
        backgroundPosition: 'center',
        color: themeData.text,
        fontFamily: themeData.font,
      }}
    >
      {loading && (
        <div className="signup-overlay">
          <CustomLoading
            userName={name || 'ThriftSeeker'}
            onComplete={() =>
              navigate(role === 'customer' ? '/customer/home' : '/store/home')
            }
          />
        </div>
      )}

      <div className={`left-scroll ${isMobile ? 'hidden' : ''}`}>
        {themes.map((theme) =>
          theme.images.map((image, idx) => (
            <img
              key={`${theme.name}-${idx}`}
              src={image}
              alt={`${theme.name}-${idx}`}
              className={`theme-image ${theme.name === currentTheme && image === currentImage ? 'active' : ''}`}
              onError={(e) => {
                console.log(`Failed to load image: ${image}`);
                e.target.src = '/images/themes/placeholder.jpg';
              }}
            />
          ))
        )}
      </div>

      <div className="right-form">
        <i
          className={`fas ${themeData.themeIcon} theme-icon`}
          style={{ color: themeData.text }}
        ></i>
        <h2>
          {role === 'customer' ? 'Customer Signup' : 'Store Owner Signup'}
        </h2>
        <p
          className="theme-tagline"
          style={{ background: themeData.taglineBg }}
        >
          {currentTagline}
        </p>
        <form onSubmit={handleSubmit} className="signup-form">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ borderColor: themeData.inputBorder }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ borderColor: themeData.inputBorder }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ borderColor: themeData.inputBorder }}
          />
          <button
            type="submit"
            style={{
              backgroundColor: themeData.buttonBg,
              fontFamily: themeData.font,
            }}
          >
            Sign Up with Email
          </button>
        </form>
        <button
          className="google-btn"
          onClick={handleGoogleSignup}
          style={{
            backgroundColor: themeData.buttonBg,
            fontFamily: themeData.font,
          }}
        >
          Sign Up with Google
        </button>
        <div className="nav-buttons">
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: themeData.buttonBg,
              fontFamily: themeData.font,
            }}
          >
            Back to Login
          </button>
        </div>
        {success && <p className="success-message">{success}</p>}
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
