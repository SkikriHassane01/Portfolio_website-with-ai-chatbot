import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Database, Eye, Server, BarChart, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const SkillBar = ({ skill, level, color }) => {
  // Convert skill level to percentage
  const percentages = {
    'Beginner': 25,
    'Intermediate': 50,
    'Advanced': 75,
    'Expert': 95
  };
  
  const percent = percentages[level];
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{skill}</span>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{level}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <motion.div 
          className="h-2.5 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </div>
  );
};

const SkillCategory = ({ title, skills, icon, color, isOpen, toggle }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <button 
        onClick={toggle}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        {isOpen ? 
          <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" /> : 
          <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        }
      </button>
      
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="px-5 pb-5"
        >
          {skills.map((skill, index) => (
            <SkillBar 
              key={index} 
              skill={skill.name} 
              level={skill.level} 
              color={skill.color || "#4C51BF"} 
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};

const SkillsSection = () => {
  // State to track which categories are open
  const [openCategories, setOpenCategories] = useState({
    datascience: true,
    machinelearning: true,
    programming: false,
    webdev: false,
    deployment: false,
    databases: false
  });

  const toggleCategory = (category) => {
    setOpenCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Skill categories with their respective skills
  const skillCategories = [
    {
      id: 'datascience',
      title: 'Data Science',
      icon: <BarChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      color: 'bg-indigo-100 dark:bg-indigo-900/30',
      skills: [
        { name: 'Data Cleaning', level: 'Expert', color: '#4C51BF' },
        { name: 'Data Visualization', level: 'Expert', color: '#4C51BF' },
        { name: 'Feature Engineering', level: 'Advanced', color: '#4C51BF' },
        { name: 'Statistical Analysis', level: 'Advanced', color: '#4C51BF' },
        { name: 'Pandas', level: 'Expert', color: '#4C51BF' },
        { name: 'Matplotlib', level: 'Advanced', color: '#4C51BF' },
        { name: 'Seaborn', level: 'Advanced', color: '#4C51BF' },
        { name: 'Tableau', level: 'Intermediate', color: '#4C51BF' }
      ]
    },
    {
      id: 'machinelearning',
      title: 'Machine Learning',
      icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      color: 'bg-blue-100 dark:bg-blue-900/30',
      skills: [
        { name: 'Scikit-learn', level: 'Advanced', color: '#3182CE' },
        { name: 'TensorFlow', level: 'Advanced', color: '#3182CE' },
        { name: 'Keras', level: 'Advanced', color: '#3182CE' },
        { name: 'Computer Vision', level: 'Advanced', color: '#3182CE' },
        { name: 'Natural Language Processing', level: 'Intermediate', color: '#3182CE' },
        { name: 'Gradient Boosting', level: 'Advanced', color: '#3182CE' },
        { name: 'Hyperparameter Tuning', level: 'Advanced', color: '#3182CE' },
        { name: 'OpenCV', level: 'Advanced', color: '#3182CE' }
      ]
    },
    {
      id: 'programming',
      title: 'Programming Languages',
      icon: <Code className="h-5 w-5 text-green-600 dark:text-green-400" />,
      color: 'bg-green-100 dark:bg-green-900/30',
      skills: [
        { name: 'Python', level: 'Expert', color: '#38A169' },
        { name: 'SQL', level: 'Advanced', color: '#38A169' },
        { name: 'C/C++', level: 'Intermediate', color: '#38A169' },
        { name: 'Java', level: 'Intermediate', color: '#38A169' },
        { name: 'JavaScript', level: 'Intermediate', color: '#38A169' },
        { name: 'C#', level: 'Beginner', color: '#38A169' }
      ]
    },
    {
      id: 'webdev',
      title: 'Web Development',
      icon: <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      color: 'bg-purple-100 dark:bg-purple-900/30',
      skills: [
        { name: 'HTML/CSS', level: 'Intermediate', color: '#805AD5' },
        { name: 'React.js', level: 'Intermediate', color: '#805AD5' },
        { name: 'Flask', level: 'Intermediate', color: '#805AD5' },
        { name: 'Streamlit', level: 'Advanced', color: '#805AD5' }
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment',
      icon: <Server className="h-5 w-5 text-red-600 dark:text-red-400" />,
      color: 'bg-red-100 dark:bg-red-900/30',
      skills: [
        { name: 'Docker', level: 'Intermediate', color: '#E53E3E' },
        { name: 'AWS (EC2)', level: 'Intermediate', color: '#E53E3E' },
        { name: 'Heroku', level: 'Advanced', color: '#E53E3E' },
        { name: 'Microsoft Azure', level: 'Beginner', color: '#E53E3E' }
      ]
    },
    {
      id: 'databases',
      title: 'Databases',
      icon: <Database className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
      color: 'bg-yellow-100 dark:bg-yellow-900/30',
      skills: [
        { name: 'SQL (PL/SQL, Oracle)', level: 'Advanced', color: '#D69E2E' },
        { name: 'MongoDB', level: 'Beginner', color: '#D69E2E' },
        { name: 'Firebase', level: 'Intermediate', color: '#D69E2E' }
      ]
    }
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="skills" className="min-h-screen pt-48 pb-48 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Technical Skills
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            My expertise spans various technologies in data science, machine learning, 
            and software development, with a focus on turning complex data into 
            meaningful insights.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {skillCategories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
            >
              <SkillCategory
                title={category.title}
                skills={category.skills}
                icon={category.icon}
                color={category.color}
                isOpen={openCategories[category.id]}
                toggle={() => toggleCategory(category.id)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Languages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-12"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Languages
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Arabic - Mother Tongue */}
              <div className="flex flex-col items-center">
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">Arabic</h4>
                <div className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
                  <span className="text-green-800 dark:text-green-300 font-medium">Mother Tongue</span>
                </div>
              </div>
              
              {/* English */}
              <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">English</h4>
                <div className="flex gap-2 mb-2">
                  {[
                    {skill: 'Listening', level: 'C1'},
                    {skill: 'Reading', level: 'C1'},
                    {skill: 'Writing', level: 'B1'},
                    {skill: 'Speaking', level: 'B1'}
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.skill}</div>
                      <div className="relative w-12 h-60 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute bottom-0 w-full bg-blue-500 dark:bg-blue-600 rounded-full"
                          initial={{ height: 0 }}
                          animate={{ 
                            height: item.level === 'C1' ? '85%' : '60%'
                          }}
                          transition={{ duration: 1, delay: 0.3 * index }}
                        />
                      </div>
                      <div className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                        {item.level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* French */}
              <div>
                <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3">French</h4>
                <div className="flex gap-2 mb-2">
                  {[
                    {skill: 'Listening', level: 'C1'},
                    {skill: 'Reading', level: 'C1'},
                    {skill: 'Writing', level: 'B1'},
                    {skill: 'Speaking', level: 'B1'}
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.skill}</div>
                      <div className="relative w-12 h-60 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute bottom-0 w-full bg-purple-500 dark:bg-purple-600 rounded-full"
                          initial={{ height: 0 }}
                          animate={{ 
                            height: item.level === 'C1' ? '85%' : '60%'
                          }}
                          transition={{ duration: 1, delay: 0.3 * index }}
                        />
                      </div>
                      <div className="mt-2 font-medium text-gray-800 dark:text-gray-200">
                        {item.level}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SkillsSection;