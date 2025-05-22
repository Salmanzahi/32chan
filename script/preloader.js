/**
 * Enhanced Preloader Script
 * Handles the progress bar animation and preloader functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get preloader elements
  const preloader = document.querySelector('.preloader');
  const progressBar = document.querySelector('.progress-bar');
  const preloaderText = document.querySelector('.preloader-text');
  
  // Text variations to display during loading
  const loadingTexts = [
    'Setting up properties...',
    'Initializing components...',
    'Preparing dashboard...',
    'Almost ready...'
  ];
  
  // Function to update loading text
  function updateLoadingText(index) {
    if (preloaderText && index < loadingTexts.length) {
      preloaderText.textContent = loadingTexts[index];
      preloaderText.style.opacity = '0';
      setTimeout(() => {
        preloaderText.style.opacity = '0.9';
      }, 200);
    }
  }
  
  // Function to manually control progress bar
  function updateProgressBar(percentage) {
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      
      // Update text at specific progress points
      if (percentage >= 20 && percentage < 50) {
        updateLoadingText(1);
      } else if (percentage >= 50 && percentage < 80) {
        updateLoadingText(2);
      } else if (percentage >= 80) {
        updateLoadingText(3);
      }
    }
  }
  
  // Remove default animation to use our custom one
  if (progressBar) {
    progressBar.style.animation = 'none';
  }
  
  // Start progress animation
  let progress = 0;
  const progressInterval = setInterval(() => {
    // Increment progress
    if (progress < 20) {
      progress += 1;
    } else if (progress < 50) {
      progress += 0.7;
    } else if (progress < 80) {
      progress += 0.5;
    } else if (progress < 98) {
      progress += 0.2;
    }
    
    // Update progress bar
    updateProgressBar(progress);
    
    // When document is fully loaded, complete the progress bar
    if (document.readyState === 'complete' && progress >= 70) {
      clearInterval(progressInterval);
      updateProgressBar(100);
      
      // Hide preloader after a short delay
      setTimeout(() => {
        if (preloader) {
          preloader.style.opacity = '0';
          setTimeout(() => {
            preloader.classList.add('hidden');
          }, 600);
        }
      }, 500);
    }
  }, 50);
  
  // Fallback to ensure preloader is removed even if something goes wrong
  window.addEventListener('load', function() {
    // Clear the interval if it's still running
    clearInterval(progressInterval);
    
    // Complete the progress bar
    updateProgressBar(100);
    
    // Hide preloader after a short delay
    setTimeout(() => {
      if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
          preloader.classList.add('hidden');
        }, 600);
      }
    }, 500);
  });
  
  // Maximum wait time fallback (10 seconds)
  setTimeout(() => {
    if (preloader && !preloader.classList.contains('hidden')) {
      clearInterval(progressInterval);
      updateProgressBar(100);
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.classList.add('hidden');
      }, 600);
    }
  }, 10000);
});
