import React from 'react';
import CustomerSidebar from '../../components/CustomerSidebar';
import './MyCloset.css';

export default function MyCloset() {
  return (
    <div className="closet">
      <CustomerSidebar activePage="closet" />
      <div className="content-container">
        <h2>My Closet</h2>
        <div className="closet-items">
          <div className="closet-item">
            <img src="/placeholder.jpg" alt="Item" />
            <h3>Vintage Jacket</h3>
            <p>Size M</p>
          </div>
          <div className="closet-item">
            <img src="/placeholder.jpg" alt="Item" />
            <h3>Denim Jeans</h3>
            <p>Size 32</p>
          </div>
        </div>
      </div>
    </div>
  );
}
