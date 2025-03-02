import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from '../styles/SkillCard.module.css';

const SkillCard = ({ skill }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  // Convert skill level to a percentage between 1-100
  const skillLevel = skill.level || Math.floor(Math.random() * 40) + 60; // Default random 60-100 if not provided

  return (
    <div 
      className={`${styles.skillCard} ${isFlipped ? styles.flipped : ''}`} 
      onClick={handleCardClick}
    ></div>
      <div className={styles.cardInner}>
        <div className={styles.cardFront}>
          <div className={styles.imageContainer}>
            {!imageError ? (
              <img
                src={skill.image}
                alt={`${skill.name} logo`}
                className={styles.skillImage}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                style={{ opacity: imageLoaded ? 1 : 0 }}
              />
            ) : (
              <div className={styles.fallbackImage}>
                {skill.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className={styles.skillName}>{skill.name}</h3>
          
          <div className={styles.skillLevelContainer}>
            <div className={styles.skillLevelText}>
              <span>{skillLevel}</span>
              <span className={styles.outOf}>/100</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div 
                className={styles.progressBar} 
                style={{ width: `${skillLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className={styles.cardBack}>
          <h3>{skill.name}</h3>
          <p>{skill.description || `My experience with ${skill.name} includes various projects and applications.`}</p>
          <div className={styles.skillLevelDetail}>
            <p>Proficiency: {skillLevel}/100</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
