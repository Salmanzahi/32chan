/**
 * Page Transitions JS
 * Handles smooth transitions between page elements and sections
 */

document.addEventListener('DOMContentLoaded', function() {
  // Configuration
  const config = {
    transitionDuration: 800, // in milliseconds
    staggerDelay: 100,      // delay between staggered elements
    observerThreshold: 0.2  // intersection observer threshold
  };

  // Initialize preloader handling
  initPreloader();
  
  // Initialize transitions for hero section
  initHeroTransitions();
  
  // Initialize transitions for feature cards
  initFeatureCards();
  
  // Initialize transitions for about section
  initAboutSection();
  
  // Initialize transitions for all elements with transition classes
  initGenericTransitions();

  /**
   * Initialize preloader with smooth transition
   */
function initPreloader() {
  const maxLoadTime = 10000; // Maximum wait time of 10 seconds
  let isLoaded = false;

  // Function to handle preloader removal
  const removePreloader = () => {
    if (isLoaded) return;
    isLoaded = true;

    const preloader = document.querySelector('.preloader');
    if (!preloader) return;
    
    // Add fade-out transition to preloader
    preloader.style.transition = `opacity ${config.transitionDuration/1000}s cubic-bezier(0.4, 0, 0.2, 1)`;
    
    setTimeout(() => {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.classList.add('hidden');
        // Trigger page content to fade in
        document.body.classList.add('page-loaded');
        
        // Trigger staggered animations for features section
        setTimeout(() => {
          const featuresSection = document.querySelector('.features-section');
          if (featuresSection) {
            featuresSection.classList.add('active');
          }
        }, 300);
      }, config.transitionDuration);
    }, 600);
  };

  // Listen for normal load event
  window.addEventListener('load', removePreloader);

  // Force remove preloader after maxLoadTime
  setTimeout(removePreloader, maxLoadTime);
}

  /**
   * Initialize hero section transitions
   */
  function initHeroTransitions() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    
    // Add active class after a short delay for entrance animation
    setTimeout(() => {
      heroSection.classList.add('active');
    }, config.transitionDuration);
  }

  /**
   * Initialize feature cards with staggered animations
   */
  function initFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length === 0) return;
    
    // Set up intersection observer for feature cards
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add active class with staggered delay based on index
          const index = Array.from(featureCards).indexOf(entry.target);
          setTimeout(() => {
            entry.target.classList.add('active');
          }, index * config.staggerDelay);
          
          // Unobserve after animation is triggered
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: config.observerThreshold });
    
    // Observe each feature card
    featureCards.forEach(card => {
      observer.observe(card);
    });
  }

  /**
   * Initialize about section transitions
   */
  function initAboutSection() {
    const aboutSection = document.querySelector('.about-section');
    if (!aboutSection) return;
    
    // Add transition classes if not already present
    aboutSection.classList.add('slide-up-transition');
    
    // Set up intersection observer for about section
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: config.observerThreshold });
    
    observer.observe(aboutSection);
  }

  /**
   * Initialize generic transitions for elements with transition classes
   */
  function initGenericTransitions() {
    // Select all elements with transition classes
    const transitionElements = document.querySelectorAll(
      '.fade-transition, .pop-transition, .slide-up-transition, ' +
      '.slide-down-transition, .slide-left-transition, .slide-right-transition'
    );
    
    if (transitionElements.length === 0) return;
    
    // Set up intersection observer for transition elements
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: config.observerThreshold });
    
    // Observe each transition element
    transitionElements.forEach(element => {
      observer.observe(element);
    });
  }
});