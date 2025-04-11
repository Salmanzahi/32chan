// Security measures to prevent right-click and console access
const security = {
    enabled: true,

    init() {
        if (this.enabled) {
            this.preventRightClick();
            this.preventConsole();
        }
    },

    preventRightClick() {
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    },

    preventConsole() {
        // Prevent F12 key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') || 
                (e.ctrlKey && e.shiftKey && e.key === 'J') || 
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        });

        // Prevent opening console through menu
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault();
            }
        });
    },

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.init();
        } else {
            // Remove event listeners when disabled
            document.removeEventListener('contextmenu', this.preventRightClick);
            document.removeEventListener('keydown', this.preventConsole);
        }
    }
};

// Initialize security measures
security.init(); 