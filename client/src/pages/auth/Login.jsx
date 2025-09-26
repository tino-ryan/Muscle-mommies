import { useEffect, useState, useMemo } from 'react'; // Add useMemo import
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../../components/LoadingScreen'; // Import your loading screen component
import { API_URL } from '../../api';
import '../../styles/login.css';

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/`;
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
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
        images: ['/images/themes/vintage.jpg'],
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

  const getRoleAndRedirect = async (uid) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/getRole`, { uid });
      const fetchedRole = res.data.role;
      setCookie(`thriftRole_${uid}`, fetchedRole, 7);
      setRole(fetchedRole);
      
      // Add a small delay to show the loading screen
      setTimeout(() => {
        if (fetchedRole === 'customer') navigate('/customer/home');
        else if (fetchedRole === 'storeOwner') navigate('/store/home');
        else if (fetchedRole === 'admin') navigate('/admin/dashboard');
      }, 2000); // 2 second delay to show loading animation
      
    } catch (err) {
      console.error(err);
      setError('Error fetching role.');
      setLoading(false); // Stop loading on error
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;
      setUserName(userCredential.user.displayName || 'ThriftSeeker');
      await getRoleAndRedirect(uid);
    } catch (err) {
      console.error(err);
      setError('Login failed.');
      setLoading(false); // Stop loading on error
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      setUserName(result.user.displayName || 'ThriftSeeker');
      await getRoleAndRedirect(uid);
    } catch (err) {
      console.error(err);
      setError('Google login failed.');
      setLoading(false); // Stop loading on error
    }
  };

  const themeData = themes.find((t) => t.name === currentTheme);

  return (
    <div
      className={`login-container ${isMobile ? 'mobile' : ''} ${swipeIn ? 'swipe-in' : ''}`}
      style={{
        backgroundColor: isMobile ? 'transparent' : themeData.bg,
        backgroundImage: isMobile ? `url(${currentImage})` : 'none',
        backgroundSize: isMobile ? 'cover' : 'auto',
        backgroundPosition: 'center',
        color: themeData.text,
        fontFamily: themeData.font,
      }}
    >
      {/* Replace the old loading overlay with the new LoadingScreen component */}
      <LoadingScreen 
        isLoading={loading}
        //logoText="THRIFT"
        logoSrc="/logo.png" 
      />

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
        <h2>Login</h2>
        <p
          className="theme-tagline"
          style={{ background: themeData.taglineBg }}
        >
          {currentTagline}
        </p>
        <form onSubmit={handleLogin} className="login-form">
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
            Login with Email
          </button>
        </form>
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          style={{
            backgroundColor: themeData.buttonBg,
            fontFamily: themeData.font,
          }}
        >
          Login with Google
        </button>
        <div className="signup-buttons">
          <button
            onClick={() => navigate('/signup/customer')}
            style={{
              backgroundColor: themeData.buttonBg,
              fontFamily: themeData.font,
            }}
          >
            Create Account
          </button>
          <button
            onClick={() => navigate('/signup/store')}
            style={{
              backgroundColor: themeData.buttonBg,
              fontFamily: themeData.font,
            }}
          >
            Create Store
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}