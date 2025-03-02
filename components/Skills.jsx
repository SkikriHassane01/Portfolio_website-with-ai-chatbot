import { useState, useEffect } from 'react';
import SkillCard from './SkillCard';
import styles from '../styles/Skills.module.css';

const Skills = () => {
  const [skills, setSkills] = useState([
    {
      name: 'JavaScript',
      image: '/images/skills/javascript.png',
      level: 90,
      description: 'Proficient in modern JavaScript including ES6+ features'
    },
    {
      name: 'React',
      image: '/images/skills/react.png',
      level: 85,
      description: 'Building interactive UIs with React and its ecosystem'
    },
    {
      name: 'Node.js',
      image: '/images/skills/nodejs.png',
      level: 80,
      description: 'Backend development with Express and Node.js'
    },
    // Add more skills as needed
  ]);

  return (
    <section className={styles.skillsSection} id="skills">
      <h2 className={styles.sectionTitle}>My Skills</h2>
      <div className={styles.skillsContainer}>
        {skills.map((skill, index) => (
          <SkillCard key={index} skill={skill} />
        ))}
      </div>
    </section>
  );
};

export default Skills;
