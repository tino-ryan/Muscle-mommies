import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomerSidebar from '../../components/CustomerSidebar'; // Fixed typo from Customerbar to CustomerSidebar
import './Badge.css';

const QUEST_API_URL =
  'https://witsquest-hjggaxgwfgbeh0gk.brazilsouth-01.azurewebsites.net';

// Fallback data for ThriftFinder Badge (stable outside component)
const fallbackThriftBadge = {
  id: 17,
  createdAt: '2025-09-25T22:15:49+00:00',
  name: 'ThriftFinder Badge',
  description: 'Earn this badge by visiting one a nearby thrift store',
  imageUrl:
    'https://pnqidfbfwiwsieysgowz.supabase.co/storage/v1/object/sign/badges/Thrift.png?token=...',
};

export default function BadgePage() {
  const [thriftBadge, setThriftBadge] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBadges = async () => {
      setLoading(true);
      try {
        const thriftResponse = await axios.get(`${QUEST_API_URL}/collectibles/17`);
        setThriftBadge(thriftResponse.data);

        const allResponse = await axios.get(`${QUEST_API_URL}/collectibles`);
        setAllBadges(allResponse.data.filter((badge) => badge.id !== 17));
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges. Please try again later.');
        setThriftBadge(fallbackThriftBadge);
        setAllBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, []);

  if (loading) {
    return (
      <div className="badge-home">
        <CustomerSidebar activePage="badges" />
        <div className="content-container">
          <div className="loading-container">
            <div className="spinner"></div>
            <div className="loading-text">Loading badges...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge-home">
        <CustomerSidebar activePage="badges" />
        <div className="content-container">
          <div className="error-container">
            <h3 className="error-title">Oops! Something went wrong</h3>
            <p className="error-message">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="badge-home">
      <CustomerSidebar activePage="badges" />
      <div className="content-container">
        <div className="header">
          <h1>Earn Badges & Rewards</h1>
          <p>
            Visit nearby thrift stores and collect badges to unlock exclusive
            rewards!
          </p>
        </div>

        {/* Featured ThriftFinder Badge */}
        <div className="featured-badge-section">
          <div className="badge-card featured">
            <img
              src={thriftBadge.imageUrl}
              alt={thriftBadge.name}
              className="badge-image"
            />
            <div className="badge-info">
              <h2 className="badge-title">{thriftBadge.name}</h2>
              <p className="badge-description">{thriftBadge.description}</p>
              <p className="badge-date">
                Available since{' '}
                {new Date(thriftBadge.createdAt).toLocaleDateString()}
              </p>
              <button
                className="claim-button"
                onClick={() =>
                  window.open(
                    'https://witsquest-hjggaxgwfgbeh0gk.brazilsouth-01.azurewebsites.net/',
                    '_blank'
                  )
                }
              >
                Claim Badge & Sign Up
              </button>
              <p className="claim-note">
                To claim this reward, sign up for the Quest app and visit a
                nearby thrift store!
              </p>
            </div>
          </div>
        </div>

        {/* Other Badges */}
        {allBadges.length > 0 && (
          <div className="other-badges-section">
            <h2 className="section-title">More Badges to Collect</h2>
            <div className="badges-grid">
              {allBadges.slice(0, 6).map((badge) => (
                <div key={badge.id} className="badge-card">
                  <img
                    src={badge.imageUrl}
                    alt={badge.name}
                    className="badge-image"
                  />
                  <h3 className="badge-title">{badge.name}</h3>
                  <p className="badge-description">{badge.description}</p>
                  <p className="badge-date">
                    Available since{' '}
                    {new Date(badge.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
            {allBadges.length > 6 && (
              <button className="view-more-button">View All Badges</button>
            )}
          </div>
        )}

        {allBadges.length === 0 && (
          <div className="no-badges">
            <p>No other badges available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}