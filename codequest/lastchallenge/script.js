// Main JavaScript for Senior-Friendly E-commerce Website

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('nav ul');
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            navMenu.classList.toggle('show');
        });
    }
    
    // Quantity selector for product page
    const quantityInput = document.getElementById('quantity');
    const increaseBtn = document.getElementById('increase-quantity');
    const decreaseBtn = document.getElementById('decrease-quantity');
    
    if (quantityInput && increaseBtn && decreaseBtn) {
        increaseBtn.addEventListener('click', function() {
            let value = parseInt(quantityInput.value, 10);
            quantityInput.value = isNaN(value) ? 1 : value + 1;
            updateTotalPrice();
        });
        
        decreaseBtn.addEventListener('click', function() {
            let value = parseInt(quantityInput.value, 10);
            if (value > 1) {
                quantityInput.value = value - 1;
                updateTotalPrice();
            }
        });
        
        quantityInput.addEventListener('change', function() {
            let value = parseInt(this.value, 10);
            if (isNaN(value) || value < 1) {
                this.value = 1;
            }
            updateTotalPrice();
        });
    }
    
    // Update total price based on quantity
    function updateTotalPrice() {
        const priceElement = document.getElementById('product-price');
        const totalElement = document.getElementById('total-price');
        const quantityInput = document.getElementById('quantity');
        
        if (priceElement && totalElement && quantityInput) {
            const price = parseFloat(priceElement.getAttribute('data-price'));
            const quantity = parseInt(quantityInput.value, 10);
            const total = price * quantity;
            totalElement.textContent = 'Rp ' + total.toLocaleString('id-ID');
        }
    }
    
    // Form validation for checkout page
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Simple validation
            let isValid = true;
            const requiredFields = checkoutForm.querySelectorAll('[required]');
            
            requiredFields.forEach(function(field) {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    
                    // Show error message
                    const errorMsg = field.parentElement.querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.style.display = 'block';
                    } else {
                        const msg = document.createElement('div');
                        msg.className = 'error-message';
                        msg.textContent = 'Bagian ini wajib diisi';
                        msg.style.color = 'var(--error-color)';
                        msg.style.fontSize = '16px';
                        msg.style.marginTop = '5px';
                        field.parentElement.appendChild(msg);
                    }
                } else {
                    field.classList.remove('error');
                    const errorMsg = field.parentElement.querySelector('.error-message');
                    if (errorMsg) {
                        errorMsg.style.display = 'none';
                    }
                }
            });
            
            if (isValid) {
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'success-message';
                successMsg.innerHTML = '<h3>Pesanan Berhasil!</h3><p>Terima kasih telah berbelanja. Pesanan Anda sedang diproses.</p>';
                successMsg.style.backgroundColor = 'var(--success-color)';
                successMsg.style.color = 'white';
                successMsg.style.padding = '20px';
                successMsg.style.borderRadius = '5px';
                successMsg.style.marginTop = '20px';
                successMsg.style.fontSize = '20px';
                
                // Replace form with success message
                checkoutForm.parentElement.replaceChild(successMsg, checkoutForm);
                
                // Scroll to success message
                successMsg.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Clear error on input
        const formInputs = checkoutForm.querySelectorAll('input, select, textarea');
        formInputs.forEach(function(input) {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorMsg = this.parentElement.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.style.display = 'none';
                }
            });
        });
    }
});