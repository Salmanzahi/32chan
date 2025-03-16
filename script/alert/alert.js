/**
 * Enhanced Alert System for 32Chan
 * Provides customizable, animated alerts with support for multiple alert types
 * and stacking multiple alerts
 */

// Create alert container if it doesn't exist
function getAlertContainer() {
    let container = document.querySelector('.alert-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'alert-container';
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Show an alert message
 * @param {string} message - The message to display
 * @param {string} type - Alert type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - How long to show the alert in milliseconds
 */
export function showAlert(message, type = 'info', duration = 2000) {
    const alertContainer = getAlertContainer();
    
    // Create alert element
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.setAttribute('role', 'alert');
    
    // Create message content
    const messageContent = document.createElement('span');
    messageContent.textContent = message;
    alertElement.appendChild(messageContent);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'alert-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Close');
    closeButton.onclick = () => dismissAlert(alertElement);
    alertElement.appendChild(closeButton);
    
    // Add to container
    alertContainer.appendChild(alertElement);
    
    // Trigger animation after a short delay
    setTimeout(() => {
        alertElement.classList.add('alert-show');
    }, 10);
    
    // Auto dismiss after duration
    if (duration > 0) {
        setTimeout(() => {
            dismissAlert(alertElement);
        }, duration);
    }
    
    return alertElement;
}

/**
 * Dismiss an alert with animation
 * @param {HTMLElement} alertElement - The alert element to dismiss
 */
function dismissAlert(alertElement) {
    if (!alertElement || alertElement.classList.contains('alert-hide')) return;
    
    alertElement.classList.remove('alert-show');
    alertElement.classList.add('alert-hide');
    
    // Remove from DOM after animation completes
    alertElement.addEventListener('animationend', () => {
        alertElement.remove();
        
        // Clean up container if empty
        const container = document.querySelector('.alert-container');
        if (container && !container.hasChildNodes()) {
            container.remove();
        }
    }, { once: true });
}

/**
 * Shorthand methods for different alert types
 */
export const alerts = {
    success: (message, duration) => showAlert(message, 'success', duration),
    error: (message, duration) => showAlert(message, 'error', duration),
    info: (message, duration) => showAlert(message, 'info', duration),
    warning: (message, duration) => showAlert(message, 'warning', duration)
};
