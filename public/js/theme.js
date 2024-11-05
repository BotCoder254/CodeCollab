class ThemeManager {
    constructor() {
        this.isDark = localStorage.getItem('theme') === 'dark';
        this.init();
    }

    init() {
        this.updateTheme();
        this.setupEventListeners();
    }

    updateTheme() {
        if (this.isDark) {
            document.documentElement.classList.add('dark');
            this.updateIcons('dark');
        } else {
            document.documentElement.classList.remove('dark');
            this.updateIcons('light');
        }
    }

    updateIcons(theme) {
        const switcher = document.getElementById('themeSwitcher');
        if (switcher) {
            const icon = switcher.querySelector('i');
            if (theme === 'dark') {
                icon.classList.replace('fa-moon', 'fa-sun');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
            }
        }
    }

    setupEventListeners() {
        const switcher = document.getElementById('themeSwitcher');
        if (switcher) {
            switcher.addEventListener('click', () => {
                this.isDark = !this.isDark;
                localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
                this.updateTheme();
            });
        }
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
}); 