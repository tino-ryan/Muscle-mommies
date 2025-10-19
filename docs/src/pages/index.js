import React from 'react';
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout
      title="ThriftFinder Project"
      description="Documentation site for the ThriftFinder group project"
    >
      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <h1>ThriftFinder(aka The Box)</h1>

        <section>
          <h2>Brought to you by :</h2>
          <ul>
            <li>Aimée</li>
            <li>Pixelbub</li>
            <li>Yurisha</li>
            <li>Tino Ryan</li>
            <li>Mosey</li>
          </ul>
        </section>

        <section>
          <h2>Project Overview</h2>
          <p>
            ThriftFinder is a local thrifting marketplace app that connects
            nearby thrift stores with shoppers looking for unique, second-hand
            fashion items. Users can browse local listings, chat with sellers,
            and reserve items for pickup or delivery.
          </p>

          <h3>Key Features</h3>
          <ul>
            <li>User signup and login (email/password + Google OAuth)</li>
            <li>Role-based profiles: Customer & Store Owner</li>
            <li>
              Dynamic store catalogs with images, descriptions, and prices
            </li>
            <li>Search & filters by location, size, category, and keywords</li>
            <li>In-app messaging between users and store owners</li>
            <li>Reservation system for items</li>
            <li>Analytics dashboard for store owners</li>
          </ul>

          <h3>Technical Architecture</h3>
          <ul>
            <li>Client: React app</li>
            <li>Server: Node.js + Express backend</li>
            <li>
              Database: Firestore for users, stores, items, messages, and
              reservations
            </li>
            <li>Authentication: Firebase Auth</li>
            <li>Hosting: Firebase Hosting for frontend, Railway for backend</li>
          </ul>

          <h3>Deployment Structure</h3>
          <ul>
            <li>
              <strong>Firebase Cloud:</strong> Firebase Auth & Firestore
              Database
            </li>
            <li>
              <strong>Client device:</strong> React App
            </li>
            <li>
              <strong>Firebase Hosting:</strong> Hosts the React frontend
            </li>
            <li>
              <strong>Railway server:</strong> Node.js backend API
            </li>
          </ul>

          <h3>Database Design</h3>
          <ul>
            <li>Users: Stores user profiles and roles</li>
            <li>Stores: Shop profiles and metadata</li>
            <li>
              Items: Thrift listings with images, sizes, categories, and status
            </li>
            <li>Messages: Chat history between users and shop owners</li>
            <li>Reservations: Tracks item bookings and timestamps</li>
            <li>Analytics: Stores engagement stats and popular items</li>
          </ul>
        </section>
      </main>
    </Layout>
  );
}
