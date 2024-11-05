class App {
    constructor() {
        this.initializeEventListeners();
        this.setupGlobalAjax();
    }

    initializeEventListeners() {
        // Global click handler for dropdowns
        document.addEventListener('click', (e) => {
            const dropdowns = document.querySelectorAll('.dropdown-content');
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            });
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showGlobalSearch();
            }
        });
    }

    setupGlobalAjax() {
        // Add loading indicator for all AJAX requests
        document.addEventListener('ajaxStart', () => {
            loading.show();
        });

        document.addEventListener('ajaxComplete', () => {
            loading.hide();
        });
    }

    showGlobalSearch() {
        // Implementation for global search
        console.log('Global search not implemented yet');
    }

    showNotification(message, type = 'success') {
        const notifications = document.getElementById('notifications');
        if (!notifications) return;

        const notification = document.createElement('div');
        notification.className = `
            flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 
            ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
        `;
        
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} text-white"></i>
            <p class="text-white">${message}</p>
        `;
        
        notifications.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize app
const app = new App();

// Make showNotification globally available
window.showNotification = app.showNotification; 