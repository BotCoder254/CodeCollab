class DashboardManager {
    constructor() {
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Project menu toggles
        document.querySelectorAll('.project-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = btn.nextElementSibling;
                // Close all other menus
                document.querySelectorAll('.project-menu').forEach(m => {
                    if (m !== menu) m.classList.add('hidden');
                });
                menu.classList.toggle('hidden');
            });
        });

        // Close menus when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.project-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        });

        // New Project button
        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => {
                this.toggleNewProjectModal(true);
            });
        }

        // Share project buttons
        document.querySelectorAll('.share-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectId;
                this.handleShareProject(projectId);
            });
        });

        // Delete project buttons
        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectId;
                this.handleDeleteProject(projectId);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // New project form submission
        const newProjectForm = document.getElementById('newProjectForm');
        if (newProjectForm) {
            newProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewProject(e.target);
            });
        }

        // Share project form submission
        const shareProjectForm = document.getElementById('shareProjectForm');
        if (shareProjectForm) {
            shareProjectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleShareProjectSubmit(e.target);
            });
        }
    }

    toggleNewProjectModal(show) {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.toggle('hidden', !show);
        }
    }

    async handleNewProject(form) {
        try {
            const response = await fetch('/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: form.name.value,
                    description: form.description.value
                })
            });

            if (response.ok) {
                window.location.reload();
            } else {
                throw new Error('Failed to create project');
            }
        } catch (error) {
            console.error('Error:', error);
            this.showNotification('Failed to create project', 'error');
        }
    }

    async handleShareProject(projectId) {
        const modal = document.getElementById('shareProjectModal');
        if (modal) {
            modal.classList.remove('hidden');
            // Load current collaborators
            await this.loadCollaborators(projectId);
        }
    }

    async handleDeleteProject(projectId) {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                const response = await fetch(`/projects/${projectId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    window.location.reload();
                } else {
                    throw new Error('Failed to delete project');
                }
            } catch (error) {
                console.error('Error:', error);
                this.showNotification('Failed to delete project', 'error');
            }
        }
    }

    async loadCollaborators(projectId) {
        try {
            const response = await fetch(`/projects/${projectId}/collaborators`);
            const collaborators = await response.json();
            const list = document.getElementById('collaboratorsList');
            if (list) {
                list.innerHTML = collaborators.map(collab => `
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                            <span class="font-medium">${collab.user.username}</span>
                            <span class="text-sm text-gray-500">(${collab.user.email})</span>
                        </div>
                        <span class="text-sm ${collab.role === 'admin' ? 'text-indigo-600' : 'text-gray-600'}">
                            ${collab.role}
                        </span>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading collaborators:', error);
        }
    }

    showNotification(message, type = 'success') {
        // Implementation of notification system
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    new DashboardManager();
}); 