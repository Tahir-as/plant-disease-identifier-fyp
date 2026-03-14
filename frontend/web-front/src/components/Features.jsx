import React from 'react';
// Import necessary icons from lucide-react
import { Camera, Zap, ShieldCheck, ClipboardCheck } from 'lucide-react';

// Features component displaying a grid of informational cards
const Features = () => {
  // Array defining the data for each feature card to keep the component clean and DRY
  const featureList = [
    {
      icon: <Camera className="feature-icon camera" size={20} />,
      title: 'Easy Upload',
      description: 'Drag & drop or click to upload plant images',
      cardClass: 'feature-card-blue' // CSS class used for specific color themes
    },
    {
      icon: <Zap className="feature-icon zap" size={20} />,
      title: 'Fast Analysis',
      description: 'AI-powered diagnosis in seconds',
      cardClass: 'feature-card-yellow'
    },
    {
      icon: <ShieldCheck className="feature-icon shield" size={20} />,
      title: 'Accurate Results',
      description: 'High confidence disease identification',
      cardClass: 'feature-card-green'
    },
    {
      icon: <ClipboardCheck className="feature-icon clipboard" size={20} />,
      title: 'Treatment Plans',
      description: 'Detailed care and prevention guides',
      cardClass: 'feature-card-purple'
    }
  ];

  return (
    <section className="features-section">
      {/* Grid container to display the feature cards in 4 columns (or less on mobile) */}
      <div className="features-grid">
        {/* Iterate over the configuration array and generate cards */}
        {featureList.map((feature, index) => (
          <div key={index} className={`feature-card ${feature.cardClass}`}>
            {/* Wrapper div provides the colored background for the icon */}
            <div className="icon-wrapper">
              {feature.icon}
            </div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
