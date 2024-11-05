class ProjectList {
    constructor() {
        this.initializeEventListeners();
        this.loadProjects();
    }

    initializeEventListeners() {
        // New Project Button
        const newProjectBtn = document.getElementById('newProjectBtn');
        if (newProjectBtn) {
            newProjectBtn.addEventListener('click', () => this.showNewProjectModal());
        }

        // Project Form
        const projectForm = document.getElementById('newProjectForm');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => this.handleNewProject(e));
        }

        // Close Modal Button
        const closeModalBtn = document.getElementById('closeShareModal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.closeAllModals());
        }

        // Global click handler for project menus
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.project-menu-btn')) {
                document.querySelectorAll('.project-menu').forEach(menu => {
                    menu.classList.add('hidden');
                });
            }
        });
    }

    async loadProjects() {
        try {
            const response = await fetch('/projects');
            const projects = await response.json();
            this.renderProjects(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            showNotification('Failed to load projects', 'error');
        }
    }

    renderProjects(projects) {
        const projectGrid = document.querySelector('.project-grid');
        if (!projectGrid) return;

        projectGrid.innerHTML = projects.map(project => this.createProjectCard(project)).join('');
        
        // Reinitialize event listeners for new project cards
        this.initializeProjectCardListeners();
    }

    createProjectCard(project) {
        return `
            <div class="bg-white overflow-hidden shadow-sm rounded-lg hover:shadow-md transition-shadow">
                <div class="p-6">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-lg font-medium text-gray-900">
                                ${project.name}
                            </h3>
                            <p class="mt-1 text-sm text-gray-500">
                                ${project.description || 'No description'}
                            </p>
                        </div>
                        <div class="relative">
                            <button class="project-menu-btn p-2 hover:bg-gray-100 rounded-full">
                                <i class="fas fa-ellipsis-v text-gray-500"></i>
                            </button>
                            <div class="project-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                                <a href="/projects/${project._id}" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-code mr-2"></i> Open Editor
                                </a>
                                <a href="/projects/${project._id}/settings" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                    <i class="fas fa-cog mr-2"></i> Settings
                                </a>
                                <button class="share-project w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" data-project-id="${project._id}">
                                    <i class="fas fa-share mr-2"></i> Share
                                </button>
                                <button class="delete-project w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" data-project-id="${project._id}">
                                    <i class="fas fa-trash mr-2"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <div class="flex items-center">
                                <i class="fas fa-users mr-1"></i>
                                ${project.collaborators.length} collaborators
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-clock mr-1"></i>
                                Updated ${new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeProjectCardListeners() {
        // Project menu toggles
        document.querySelectorAll('.project-menu-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const menu = btn.nextElementSibling;
                document.querySelectorAll('.project-menu').forEach(m => {
                    if (m !== menu) m.classList.add('hidden');
                });
                menu.classList.toggle('hidden');
            });
        });

        // Share buttons
        document.querySelectorAll('.share-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectId;
                this.handleShareProject(projectId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-project').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projectId = e.currentTarget.dataset.projectId;
                this.handleDeleteProject(projectId);
            });
        });
    }

    showNewProjectModal() {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('projectName')?.focus();
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

    async handleShareProject(projectId) {
        const modal = document.getElementById('shareProjectModal');
        if (modal) {
            modal.classList.remove('hidden');
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

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ProjectList();
}); 