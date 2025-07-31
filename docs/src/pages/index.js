import React from 'react';
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout
      title="Our Project"
      description="Documentation site for our group project"
    >
      <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Group: Muscle mommies💅🏾 </h1>
        <h2>Members</h2>
        <ul>
          <li>Mosey Wosey</li>
          <li>Aimée</li>
          <li>pixelbub</li>
          <li>Yurisha</li>
          <li>Tino Ryan</li>

        </ul>

      </main>
    </Layout>
  );
}
