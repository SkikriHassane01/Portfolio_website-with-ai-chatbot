import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import AboutSection from './components/sections/About';
import ProjectsSection from './components/sections/Projects';
import SkillsSection from './components/sections/Skills';
import CertificatesSection from './components/sections/Certificates';
import ContactSection from './components/sections/Contact';  
import Footer from './components/layout/Footer';
import ChatWindow from './components/chatbot/ChatWindow';
import TechSphere from './components/sections/TechSphere';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <main>
          <AboutSection />
          <TechSphere />
          <ProjectsSection/>
          <SkillsSection/>
          <CertificatesSection/>
          <ContactSection/>
        </main>
        <Footer />
        
        {/* Chatbot */}
        <ChatWindow />
      </div>
    </ThemeProvider>
  );
}

export default App;