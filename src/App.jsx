import React, { useState } from 'react';

function App() {
  const [isDark, setIsDark] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'About', id: 'about' },
    { label: 'Projects', id: 'projects' },
    { label: 'Skills', id: 'skills' },
    { label: 'Certificates', id: 'certificates' },
    { label: 'Contact', id: 'contact' }
  ];

  return (
    <div className={`min-h-screen bg-white ${isDark ? 'dark' : ''}`}>
      {/* Navigation */}
      <nav className="fixed w-full bg-white shadow-lg dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Portfolio
            </span>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white
                    px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.label}
                </a>
              ))}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700
                  text-gray-800 dark:text-gray-200"
              >
                {isDark ? '☀️' : '🌙'}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {isMenuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block px-3 py-2 rounded-md text-base font-medium
                    text-gray-600 hover:text-gray-900 hover:bg-gray-50
                    dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="pt-16">
        {navItems.map((item) => (
          <section
            key={item.id}
            id={item.id}
            className="min-h-screen p-8 bg-white dark:bg-gray-900"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {item.label} Section
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              This is the {item.label.toLowerCase()} section content.
            </p>
          </section>
        ))}
      </main>
    </div>
  );
}

export default App;