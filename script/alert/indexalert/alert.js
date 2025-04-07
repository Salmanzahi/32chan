// Forum button authentication check
document.addEventListener('DOMContentLoaded', function() {
  // Function to add click handlers to elements
  function addAuthCheckToElements(selectors) {
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.addEventListener('click', handleForumClick);
      });
    });
  }
  
  function handleForumClick(event) {
    // Get the current Firebase auth state
    const user = firebase.auth().currentUser;
    
    // If user is not authenticated, show notification and prevent navigation
    if (!user) {
      event.preventDefault();
      
      // Create and show the alert
      const alertContainer = document.createElement('div');
      alertContainer.className = 'alert-container';
      document.body.appendChild(alertContainer);
      
      const alertElement = document.createElement('div');
      alertElement.className = 'alert alert-error alert-show';
      alertElement.setAttribute('role', 'alert');
      
      const messageContent = document.createElement('span');
      messageContent.textContent = 'Please choose an authentication method before joining the forum.';
      alertElement.appendChild(messageContent);
      
      const closeButton = document.createElement('button');
      closeButton.className = 'alert-close';
      closeButton.innerHTML = '&times;';
      closeButton.setAttribute('aria-label', 'Close');
      
      // Function to dismiss the alert
      function dismissAlert() {
        alertElement.classList.remove('alert-show');
        alertElement.classList.add('alert-hide');
        
        // Remove after animation
        setTimeout(function() {
          alertElement.remove();
          if (!alertContainer.hasChildNodes()) {
            alertContainer.remove();
          }
        }, 500);
      }
      
      closeButton.onclick = dismissAlert;
      alertElement.appendChild(closeButton);
      alertContainer.appendChild(alertElement);
      
      // Scroll to the auth buttons at the top
      const navbarContainer = document.getElementById('navbarContainer');
      if (navbarContainer) {
        navbarContainer.scrollIntoView({ behavior: 'smooth' });
      }
      
      // Auto dismiss after 5 seconds
      setTimeout(dismissAlert, 2000);
    }
  }
  
  // Add initial click handlers
  addAuthCheckToElements(['.hero-button-primary', '.hero-button-secondary']);
  
  // Setup a mutation observer to handle dynamically loaded navbar links
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        // Check if navbar has been loaded
        const navbarContainer = document.getElementById('navbarContainer');
        if (navbarContainer && navbarContainer.children.length > 0) {
          // Add handlers to navbar links
          addAuthCheckToElements(['a[href="./sendview.html"]']);
          
          // Disconnect once we've added the handlers
          observer.disconnect();
        }
      }
    });
  });
  
  // Start observing the document body for DOM changes
  observer.observe(document.body, { childList: true, subtree: true });
});
