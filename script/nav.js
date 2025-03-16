
// // Mobile Menu Toggle
    // const mobileMenuButton = document.getElementById('mobile-menu-button');
    // const mobileMenu = document.getElementById('mobile-menu');
    // mobileMenuButton.addEventListener('click', () => {
    //   mobileMenu.classList.toggle('hidden');
    // });

    // // Theme Toggle Functionality
    // const themeToggleBtn = document.getElementById('themeToggleBtn');
    // themeToggleBtn.addEventListener('click', () => {
    //   document.body.classList.toggle('light-mode');
    // });

 
     

        // Improved mobile menu toggle with proper error handling
        document.addEventListener('DOMContentLoaded', function() {
            const mobileMenuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
          
            if (mobileMenuButton && mobileMenu) {
              mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
              });
            } else {
              console.error('Mobile menu elements not found');
            }
        });
   