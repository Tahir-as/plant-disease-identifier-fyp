import React from 'react';

// Hero component displays the main heading and introduction text
const Hero = () => {
  return (
    <section className="hero-section">
      {/* Main attention-grabbing title */}
      <h2>Identify Plant Diseases Instantly</h2>
      
      {/* Subtitle explaining the app's purpose */}
      <p>
        Upload an image of your plant and let our AI-powered system diagnose diseases, 
        provide treatment recommendations, and prevention tips.
      </p>
    </section>
  );
};

export default Hero;
