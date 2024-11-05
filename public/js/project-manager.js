class ProjectManager {
    constructor() {
        this.currentProjectId = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // New Project
        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => this.showNewProjectModal());
        }

        // Project Form
        const projectForm = document.getElementById('newProjectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleNewProject(e));
        }

        // Cancel Button
        const cancelBtn = document.getElementById('cancelProjectBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideNewProjectModal());
        }

        // Project Menu Buttons
        document.querySelectorAll('.project-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.toggleProjectMenu(e));
        });

        // Share Project Buttons
        document.querySelectorAll('.share-project').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleShareProject(e));
        });

        // Delete Project Buttons
        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteProject(e));
        });

        // Close Share Modal
        const closeShareBtn = document.getElementById('closeShareModal');
        if (closeShareBtn) {
            closeShareBtn.addEventListener('click', () => this.hideShareModal());
        }

        // Invite Collaborator
        const inviteBtn = document.getElementById('inviteCollaborator');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => this.handleInviteCollaborator());
        }

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.project-menu-btn')) {
                document.querySelectorAll('.project-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
    }

    showNewProjectModal() {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('projectName')?.focus();
        }
    }

    hideNewProjectModal() {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.add('hidden');
            document.getElementById('newProjectForm')?.reset();
        }
    }

    async handleNewProject(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';

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
                showNotification('Project created successfully!', 'success');
                window.location.reload();
            } else {
                throw new Error('Failed to create project');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to create project', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Create Project';
        }
    }

    toggleProjectMenu(e) {
        e.stopPropagation();
        const menu = e.currentTarget.nextElementSibling;
        
        // Close all other menus
        document.querySelectorAll('.project-menu').forEach(m => {
            if (m !== menu) m.classList.add('hidden');
        });
        
        menu.classList.toggle('hidden');
    }

    async handleShareProject(e) {
        const projectId = e.currentTarget.dataset.projectId;
        this.currentProjectId = projectId;
        const modal = document.getElementById('shareProjectModal');
        
        if (modal) {
            modal.classList.remove('hidden');
            await this.loadCollaborators(projectId);
        }
    }

    hideShareModal() {
        const modal = document.getElementById('shareProjectModal');
        if (modal) {
            modal.classList.add('hidden');
            this.currentProjectId = null;
        }
    }

    async loadCollaborators(projectId) {
        try {
            const response = await fetch(`/projects/${projectId}/collaborators`);
            const collaborators = await response.json();
            this.renderCollaborators(collaborators);
        } catch (error) {
            console.error('Error loading collaborators:', error);
            showNotification('Failed to load collaborators', 'error');
        }
    }

    renderCollaborators(collaborators) {
        const list = document.getElementById('collaboratorsList');
        if (!list) return;

        list.innerHTML = collaborators.map(collab => `
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                    <span class="font-medium">${collab.user.username}</span>
                    <span class="text-sm text-gray-500">(${collab.user.email})</span>
                </div>
                <div class="flex items-center space-x-2">
                    <select class="collaborator-role text-sm border-gray-300 rounded"
                            data-user-id="${collab.user._id}"
                            ${collab.role === 'admin' ? 'disabled' : ''}>
                        <option value="read" ${collab.role === 'read' ? 'selected' : ''}>Read</option>
                        <option value="write" ${collab.role === 'write' ? 'selected' : ''}>Write</option>
                        <option value="admin" ${collab.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    ${collab.role !== 'admin' ? `
                        <button class="remove-collaborator text-red-600 hover:text-red-700"
                                onclick="projectManager.removeCollaborator('${collab.user._id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add event listeners for role changes
        document.querySelectorAll('.collaborator-role').forEach(select => {
            select.addEventListener('change', (e) => this.handleRoleChange(e));
        });
    }

    async handleInviteCollaborator() {
        const emailInput = document.getElementById('collaboratorEmail');
        if (!emailInput || !this.currentProjectId) return;

        try {
            const response = await fetch(`/projects/${this.currentProjectId}/collaborators`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: emailInput.value
                })
            });

            if (response.ok) {
                showNotification('Collaborator invited successfully', 'success');
                emailInput.value = '';
                await this.loadCollaborators(this.currentProjectId);
            } else {
                throw new Error('Failed to invite collaborator');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to invite collaborator', 'error');
        }
    }

    async handleRoleChange(e) {
        const userId = e.target.dataset.userId;
        const newRole = e.target.value;
        
        try {
            const response = await fetch(`/projects/${this.currentProjectId}/collaborators/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                showNotification('Collaborator role updated', 'success');
            } else {
                throw new Error('Failed to update role');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to update role', 'error');
            e.target.value = e.target.dataset.originalRole;
        }
    }

    async removeCollaborator(userId) {
        if (!confirm('Are you sure you want to remove this collaborator?')) return;

        try {
            const response = await fetch(`/projects/${this.currentProjectId}/collaborators/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Collaborator removed successfully', 'success');
                await this.loadCollaborators(this.currentProjectId);
            } else {
                throw new Error('Failed to remove collaborator');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to remove collaborator', 'error');
        }
    }

    async handleDeleteProject(e) {
        const projectId = e.currentTarget.dataset.projectId;
        
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                const response = await fetch(`/projects/${projectId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showNotification('Project deleted successfully', 'success');
                    window.location.reload();
                } else {
                    throw new Error('Failed to delete project');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to delete project', 'error');
            }
        }
    }
}

// Initialize project manager
const projectManager = new ProjectManager(); 