// Improved mobile menu toggle with proper error handling and mutation observer
// This ensures the mobile menu works even when the navbar is loaded dynamically

// Variables for scroll detection
let lastScrollTop = 0;
let navbar;
let scrollThreshold = 2; // Minimum scroll amount to trigger navbar hide/show

// Function to handle clicks outside the navbar
function handleClickOutside(event) {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const menuIcon = document.querySelector('.menu-icon');
    
    // Check if click is outside both the mobile menu and the button
    if (mobileMenu && mobileMenuButton && menuIcon) {
        const isClickInside = mobileMenu.contains(event.target) || mobileMenuButton.contains(event.target);
        
        if (!isClickInside && !mobileMenu.classList.contains('hidden')) {
            // Close the menu with animation
            mobileMenu.classList.remove('active');
            menuIcon.classList.remove('active');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 500); // Match this with your CSS transition duration
            
            console.log('Mobile menu closed by clicking outside with animation');
        }
    }
}

// Function to initialize mobile menu functionality
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        // Remove any existing event listeners to prevent duplicates
        mobileMenuButton.removeEventListener('click', toggleMobileMenu);
        
        // Add the event listener with a named function for easier removal if needed
        mobileMenuButton.addEventListener('click', toggleMobileMenu);
        
        // Add click outside listener
        document.addEventListener('click', handleClickOutside);
        
        // Add a visual feedback class for better UX
        mobileMenuButton.classList.add('menu-button-initialized');
        console.log('Mobile menu initialized successfully');
    } else {
        console.error('Mobile menu elements not found, will retry when DOM changes');
    }
}

// Function to toggle mobile menu visibility
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');
    
    if (mobileMenu && menuIcon) {
        // If menu is currently hidden, show it first then animate
        if (mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.remove('hidden');
            // Small delay to ensure the transition works properly
            setTimeout(() => {
                mobileMenu.classList.add('active');
                menuIcon.classList.add('active');
            }, 10);
        } else {
            // If menu is visible, animate out then hide
            mobileMenu.classList.remove('active');
            menuIcon.classList.remove('active');
            // Wait for animation to complete before hiding
            setTimeout(() => {
                mobileMenu.classList.add('hidden');
            }, 500); // Match this with your CSS transition duration
        }
        console.log('Mobile menu toggled with animation');
    }
}

// Function to handle scroll events
function handleScroll() {
    if (!navbar) {
        navbar = document.querySelector('nav');
        if (!navbar) return;
    }
    
    const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Check if we've scrolled more than the threshold
    if (Math.abs(lastScrollTop - currentScrollTop) <= scrollThreshold) {
        return;
    }
    
    // Scrolling down
    if (currentScrollTop > lastScrollTop && currentScrollTop > 50) {
        navbar.classList.add('nav-hidden');
    } 
    // Scrolling up
    else if (currentScrollTop < lastScrollTop) {
        navbar.classList.remove('nav-hidden');
    }
    
    lastScrollTop = currentScrollTop;
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize immediately
    initMobileMenu();
    
    // Initialize scroll event listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Set up a MutationObserver to watch for changes to the DOM
    // This helps when the navbar is loaded dynamically via fetch
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                // Check if our mobile menu button exists now
                if (document.getElementById('mobile-menu-button')) {
                    initMobileMenu();
                }
                // Check if navbar exists now
                if (!navbar && document.querySelector('nav')) {
                    navbar = document.querySelector('nav');
                }
            }
        });
    });
    
    // Start observing the document body for DOM changes
    observer.observe(document.body, { childList: true, subtree: true });
});

// Also initialize when window loads (backup)
window.addEventListener('load', function() {
    initMobileMenu();
    // Get navbar reference
    navbar = document.querySelector('nav');
});

