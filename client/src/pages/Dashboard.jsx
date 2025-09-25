import { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';
import { API_URL } from '../api';

// Cookie helpers
function setCookie(name, value, days) {
  var expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = '; expires=' + date.toUTCString();
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseAllRoleCookies() {
  document.cookie.split(';').forEach((cookie) => {
    if (cookie.trim().startsWith('thriftRole_')) {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
    }
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [userName, setUserName] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [showMessage, setShowMessage] = useState(true);
  const [swiping, setSwiping] = useState(false);

  const messages = [
    'Initializing thrift engine...',
    'Welcome, style scavenger.',
    "You're entering the vintage vault.",
    'Loading gems from the past...',
    'Hold on, rewinding time to prime thrift era.',
    'Get set for timeless treasures.',
    'Welcome to ThriftFinder!',
  ];

  const typingSpeed = 50;
  const fadeOutDelay = 2500;

  const getRoleAndRedirect = async (uid) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/getRole`, { uid });
      const fetchedRole = res.data.role;
      setCookie(`thriftRole_${uid}`, fetchedRole, 7);
      setRole(fetchedRole);

      setTimeout(() => {
        setSwiping(true);
        setTimeout(() => {
          if (fetchedRole === 'customer') navigate('/customer/home');
          else if (fetchedRole === 'storeOwner') navigate('/store/home');
          else if (fetchedRole === 'admin') navigate('/admin/dashboard');
          else {
            eraseAllRoleCookies();
            navigate('/login');
          }
        }, 1200);
      }, 200);
    } catch (err) {
      console.error('Error fetching role:', err);
      eraseAllRoleCookies();
      setSwiping(true);
      setTimeout(() => navigate('/login'), 1200);
    }
  };

  // Auto login check
  useEffect(() => {
    axios.get(API_URL); // ping server

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setRole('guest');
        setLoading(false);
        return;
      }

      setUserName(user.displayName || 'ThriftExplorer');
      const cachedRole = getCookie(`thriftRole_${user.uid}`);
      if (cachedRole) {
        setRole(cachedRole);
        setLoading(false);

        setTimeout(() => {
          setSwiping(true);
          setTimeout(() => {
            if (cachedRole === 'customer') navigate('/customer/home');
            else if (cachedRole === 'storeOwner') navigate('/store/home');
            else if (cachedRole === 'admin') navigate('/admin/dashboard');
            else {
              eraseAllRoleCookies();
              navigate('/login');
            }
          }, 1200);
        }, 200);
      } else {
        await getRoleAndRedirect(user.uid);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Typing intro + fallback login redirect
  useEffect(() => {
    if (!loading && role === 'guest') {
      const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];
      let i = -1;
      setCurrentText('');

      const typeText = () => {
        if (i < randomMessage.length) {
          setCurrentText((prev) => prev + randomMessage.charAt(i));
          i++;
          setTimeout(typeText, typingSpeed);
        } else {
          setTimeout(() => {
            setShowMessage(false);
            setSwiping(true);
            setTimeout(() => navigate('/login'), 1200);
          }, fadeOutDelay);
        }
      };

      typeText();
    }
  }, [loading, role, navigate]);

  const handleManualNav = (path) => {
    setShowMessage(false);
    setSwiping(true);
    setTimeout(() => navigate(path), 1200);
  };

  return (
    <div id="dashboard-wrapper" className={swiping ? 'swipe-out' : ''}>
      {role === 'guest' && (
        <nav>
          <div className="flex space-x-4 flex-wrap">
            <button onClick={() => handleManualNav('/login')}>
              UNLOCK THE VAULT
            </button>
          </div>
          <div className="title">THRIFTFINDER</div>
        </nav>
      )}
      <main>
        <div className="text-center">
          {showMessage && (
            <div className={`message ${currentText ? 'typing' : ''}`}>
              {currentText}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
