import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useExtensionStats } from '../../hooks/useExtensionStats';
import { formatNumber, formatRating, formatVersion } from '../../utils/formatNumbers';

const DownloadSection = () => {
  const [copied, setCopied] = useState(false);
  const { downloads, installs, rating, version, loading, error } = useExtensionStats();

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('ext install aMonteSl.code-xr');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="slide download-slide" id="download">
      <div className="download-content">
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Get <span className="brand">Code-XR</span>
        </motion.h2>

        <motion.p 
          className="download-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Start visualizing your code in XR today. Free and open source.
        </motion.p>

        {/* Download Stats */}
        <motion.div 
          className="download-stats-grid"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="download-stat">
            <div className={`download-stat-number ${loading ? 'loading' : ''}`}>
              {loading ? '...' : formatNumber(installs)}
            </div>
            <div className="download-stat-label">Active Installs</div>
          </div>
          <div className="download-stat">
            <div className={`download-stat-number ${loading ? 'loading' : ''}`}>
              {loading ? '...' : formatRating(rating)}
            </div>
            <div className="download-stat-label">User Rating</div>
          </div>
          <div className="download-stat">
            <div className={`download-stat-number version-number ${loading ? 'loading' : ''}`}>
              {loading ? '...' : formatVersion(version)}
            </div>
            <div className="download-stat-label">Latest Version</div>
          </div>
        </motion.div>

        {/* Download Buttons */}
        <motion.div 
          className="download-buttons"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <a
            href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
            target="_blank"
            rel="noopener noreferrer"
            className="download-button primary"
          >
            <span>📦</span>
            Install from Marketplace
          </a>
          <a
            href="https://github.com/aMonteSl/babiaxr-vscode"
            target="_blank"
            rel="noopener noreferrer"
            className="download-button secondary"
          >
            <span>⭐</span>
            View on GitHub
          </a>
        </motion.div>

        {/* Install Command */}
        <motion.div 
          className="install-command"
          onClick={copyCommand}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="command-label">Quick Install:</span>
          <code className="command-text">ext install aMonteSl.code-xr</code>
          <button className="copy-button">
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
          {copied && <div className="copy-tooltip">Copied to clipboard!</div>}
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div 
            className="stats-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Unable to load live stats from VS Code Marketplace
          </motion.div>
        )}
      </div>

      {/* Version Footer */}
      <motion.div 
        className="version-footer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="version-footer-content">
          <div className="version-info-detailed">
            <div className="version-current">
              <span className="version-label">Current Version:</span>
              <span className={`version-number-detailed ${loading ? 'loading' : ''}`}>
                {loading ? '...' : formatVersion(version)}
              </span>
            </div>
            <div className="version-details">
              <span className="version-compatibility">
                Compatible with VS Code 1.74.0+
              </span>
              <span className="version-updated">
                Updated regularly
              </span>
            </div>
          </div>
          <div className="footer-links">
            <a href="https://github.com/aMonteSl/babiaxr-vscode/blob/main/CHANGELOG.md" target="_blank" rel="noopener noreferrer">
              Changelog
            </a>
            <a href="https://github.com/aMonteSl/babiaxr-vscode/issues" target="_blank" rel="noopener noreferrer">
              Report Issues
            </a>
            <a href="https://github.com/aMonteSl/babiaxr-vscode/blob/main/README.md" target="_blank" rel="noopener noreferrer">
              Documentation
            </a>
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <div className="floating-element"></div>
    </div>
  );
};

export default DownloadSection;