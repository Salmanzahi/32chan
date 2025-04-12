class HeroCarousel {
  constructor(images, interval = 5000) {
    this.images = images;
    this.interval = interval;
    this.currentIndex = 0;
    this.timer = null;
    this.heroSection = document.querySelector('.hero-section');
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50; // Minimum distance for a swipe
    
    this.init();
  }

  init() {
    // Create background elements
    this.images.forEach((img, index) => {
      const background = document.createElement('div');
      background.className = `hero-background ${index === 0 ? 'active' : ''}`;
      background.style.backgroundImage = `url('${img}')`;
      this.heroSection.insertBefore(background, this.heroSection.firstChild);
    });

    // Create arrow navigation
    const arrows = document.createElement('div');
    arrows.className = 'hero-arrows';
    arrows.innerHTML = `
      <button class="hero-arrow prev" aria-label="Previous slide">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
        </svg>
      </button>
      <button class="hero-arrow next" aria-label="Next slide">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
        </svg>
      </button>
    `;
    this.heroSection.appendChild(arrows);

    // Create navigation dots
    const nav = document.createElement('div');
    nav.className = 'hero-nav';
    nav.innerHTML = this.images.map((_, index) => `
      <div class="hero-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');
    this.heroSection.appendChild(nav);

    // Add event listeners for dots
    nav.querySelectorAll('.hero-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this.goToSlide(parseInt(dot.dataset.index));
        this.resetTimer();
      });
    });

    // Add event listeners for arrows
    arrows.querySelector('.prev').addEventListener('click', () => {
      this.prevSlide();
      this.resetTimer();
    });

    arrows.querySelector('.next').addEventListener('click', () => {
      this.nextSlide();
      this.resetTimer();
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        this.prevSlide();
        this.resetTimer();
      } else if (e.key === 'ArrowRight') {
        this.nextSlide();
        this.resetTimer();
      }
    });

    // Add touch event listeners
    this.heroSection.addEventListener('touchstart', (e) => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });

    this.heroSection.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches.length > 1) return; // Ignore multi-touch
      this.touchEndX = e.touches[0].clientX;
    }, { passive: true });

    this.heroSection.addEventListener('touchend', () => {
      this.handleSwipe();
    }, { passive: true });

    // Start auto-rotation
    this.startAutoRotation();

    // Pause on hover (desktop only)
    if (window.matchMedia('(min-width: 769px)').matches) {
      this.heroSection.addEventListener('mouseenter', () => this.stopAutoRotation());
      this.heroSection.addEventListener('mouseleave', () => this.startAutoRotation());
    }
  }

  handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    
    if (Math.abs(swipeDistance) > this.minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped right - go to previous slide
        this.prevSlide();
      } else {
        // Swiped left - go to next slide
        this.nextSlide();
      }
      this.resetTimer();
    }
    
    // Reset touch coordinates
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  updateSlides() {
    const backgrounds = this.heroSection.querySelectorAll('.hero-background');
    const dots = this.heroSection.querySelectorAll('.hero-dot');
    
    backgrounds.forEach(bg => bg.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    backgrounds[this.currentIndex].classList.add('active');
    dots[this.currentIndex].classList.add('active');
  }

  goToSlide(index) {
    this.currentIndex = index;
    this.updateSlides();
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateSlides();
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateSlides();
  }

  startAutoRotation() {
    if (this.timer) this.stopAutoRotation();
    this.timer = setInterval(() => this.nextSlide(), this.interval);
  }

  stopAutoRotation() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  resetTimer() {
    this.stopAutoRotation();
    this.startAutoRotation();
  }
}

// Initialize with hero images
const heroImages = [
  './images/hero/hero1.jpg',
  './images/hero/hero2.png',
  './images/hero/hero3.png',
  './images/hero/hero4.png'
];

document.addEventListener('DOMContentLoaded', () => {
  new HeroCarousel(heroImages, 5000);
}); 