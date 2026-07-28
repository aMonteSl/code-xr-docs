import React from 'react';

const SectionDivider = ({ direction = 'down' }) => {
  return (
    <div className="relative w-full overflow-hidden">
      {direction === 'down' ? (
        <svg
          className="absolute bottom-0 left-0 w-full h-16 text-gray-900"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <path
            fill="currentColor"
            d="M0,256L48,240C96,224,192,192,288,160C384,128,480,96,576,112C672,128,768,192,864,213.3C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      ) : (
        <svg
          className="absolute top-0 left-0 w-full h-16 text-gray-900"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
        >
          <path
            fill="currentColor"
            d="M0,64L48,96C96,128,192,192,288,213.3C384,235,480,213,576,186.7C672,160,768,128,864,112C960,96,1056,96,1152,112C1248,128,1344,160,1392,176L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
      )}
    </div>
  );
};

export default SectionDivider;
