import React, { useState, useEffect } from 'react';

const TestTailwind = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(darkModeQuery.matches);
    
    // Apply dark class to html
    if (darkModeQuery.matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-cyan-300 transition-colors duration-300">
      {/* Test Section */}
      <section className="min-h-screen flex flex-col justify-center items-center space-y-8 px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-center">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Tailwind CSS Test
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 dark:text-cyan-400 text-center max-w-2xl">
          If you can see this styled text with colors and responsive design, Tailwind CSS is working correctly!
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={toggleTheme}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200"
          >
            Toggle {isDark ? 'Light' : 'Dark'} Mode
          </button>
          
          <button className="border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white px-6 py-3 rounded-lg transition-colors duration-200">
            Test Button
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-blue-500 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Card 1</h3>
            <p className="text-gray-600 dark:text-gray-300">This is a test card with Tailwind styles.</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-green-500 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Card 2</h3>
            <p className="text-gray-600 dark:text-gray-300">Another test card to verify responsive grid.</p>
          </div>
          
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-purple-500 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Card 3</h3>
            <p className="text-gray-600 dark:text-gray-300">Final test card with hover effects.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestTailwind;
