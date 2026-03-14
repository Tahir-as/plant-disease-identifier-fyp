import React from 'react';

// TipsSection provides guidance to users on how to capture the best photo
const TipsSection = () => {
  return (
    <section className="tips-section">
      <h3>Tips for Best Results</h3>
      {/* 2-column grid layout for the tips */}
      <div className="tips-grid">
        {/* Left column tips */}
        <ul className="tips-list">
          <li>Take photos in natural daylight for clarity</li>
          <li>Ensure the image is clear and in focus</li>
        </ul>
        {/* Right column tips */}
        <ul className="tips-list">
          <li>Focus on leaves showing symptoms</li>
          <li>Include close-up details of affected areas</li>
        </ul>
      </div>
    </section>
  );
};

export default TipsSection;
