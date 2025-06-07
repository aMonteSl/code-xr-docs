import React from 'react';
import { motion } from 'framer-motion';

// Import technology logos
import NodejsLogo from '../../assets/logos/nodejs.svg';
import TypescriptLogo from '../../assets/logos/typescript.svg';
import AframeLogo from '../../assets/logos/aframe.png';
import BabiaXRLogo from '../../assets/logos/babiaxr.png';
import PythonLogo from '../../assets/logos/python.svg';
import WebXRLogo from '../../assets/logos/webxr.png';

const TechnologiesSection = ({ goToSlide }) => {
  const technologies = [
    {
      name: 'Node.js',
      description: 'Backend processing and extension infrastructure built on Node.js runtime.',
      logo: NodejsLogo,
      category: 'Backend',
      color: '#339933'
    },
    {
      name: 'TypeScript',
      description: 'Type-safe development for robust and maintainable VS Code extension.',
      logo: TypescriptLogo,
      category: 'Language',
      color: '#3178c6'
    },
    {
      name: 'A-Frame',
      description: 'Web framework for building virtual reality experiences with HTML.',
      logo: AframeLogo,
      category: 'XR Framework',
      color: '#ef2d5e'
    },
    {
      name: 'BabiaXR',
      description: 'Data visualization library specialized in XR environments.',
      logo: BabiaXRLogo,
      category: 'Visualization',
      color: '#ff6b35'
    },
    {
      name: 'Python',
      description: 'Code analysis and metrics calculation through Python integration.',
      logo: PythonLogo,
      category: 'Analysis',
      color: '#3776ab'
    },
    {
      name: 'WebXR',
      description: 'Standard for accessing VR and AR devices through web browsers.',
      logo: WebXRLogo,
      category: 'API',
      color: '#ff6b9d'
    }
  ];

  return (
    <div className="slide technologies-slide" id="technologies">
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <span className="brand">Technologies</span> Used
      </motion.h2>

      <motion.p 
        className="technologies-subtitle"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Built with cutting-edge technologies for maximum performance and compatibility
      </motion.p>

      <motion.div 
        className="technologies-grid"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {technologies.map((tech, index) => (
          <motion.div
            key={tech.name}
            className="tech-card"
            style={{ '--tech-color': tech.color }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.5 + index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ y: -8 }}
          >
            <div className="tech-category">{tech.category}</div>
            <div className="tech-logo-container">
              <img 
                src={tech.logo} 
                alt={tech.name}
                className="tech-logo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div 
                className="tech-icon" 
                style={{ display: 'none', backgroundColor: tech.color }}
              >
                {tech.name.charAt(0)}
              </div>
            </div>
            <h3 className="tech-name">{tech.name}</h3>
            <p className="tech-description">{tech.description}</p>
            <div className="tech-accent" style={{ background: tech.color }}></div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="technologies-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        <p>
          Our technology stack ensures cross-platform compatibility, 
          high performance, and future-proof XR experiences.
        </p>
      </motion.div>

      {/* Next Section Arrow */}
      <div 
        className="next-section-arrow" 
        onClick={() => goToSlide(6)}
      >
        <div className="arrow-icon">↓</div>
      </div>
    </div>
  );
};

export default TechnologiesSection;