class FileExplorer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.projectId = options.projectId;
        this.currentPath = '/';
        this.selectedFile = null;
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    async render() {
        const files = await this.fetchFiles();
        const fileTree = this.buildFileTree(files);
        this.container.innerHTML = this.generateHTML(fileTree);
    }

    buildFileTree(files) {
        const root = { type: 'folder', name: '/', children: {}, path: '/' };
        
        files.forEach(file => {
            const parts = file.path.split('/').filter(p => p);
            let current = root;
            
            parts.forEach((part, index) => {
                if (!current.children[part]) {
                    current.children[part] = {
                        type: index === parts.length - 1 ? file.type : 'folder',
                        name: part,
                        children: {},
                        path: '/' + parts.slice(0, index + 1).join('/'),
                        id: file._id
                    };
                }
                current = current.children[part];
            });
        });
        
        return root;
    }

    generateHTML(node, level = 0) {
        const indent = level * 20;
        let html = '';

        if (level > 0) {
            html += `
                <div class="file-item" data-path="${node.path}" data-type="${node.type}" data-id="${node.id}"
                     style="padding-left: ${indent}px">
                    <div class="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                        <i class="fas ${node.type === 'folder' ? 'fa-folder' : 'fa-file-code'} text-gray-400"></i>
                        <span class="file-name">${node.name}</span>
                        <div class="file-actions hidden ml-auto">
                            <button class="rename-file p-1 hover:text-indigo-400">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-file p-1 hover:text-red-400">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        if (node.type === 'folder') {
            Object.values(node.children)
                .sort((a, b) => {
                    if (a.type === b.type) return a.name.localeCompare(b.name);
                    return a.type === 'folder' ? -1 : 1;
                })
                .forEach(child => {
                    html += this.generateHTML(child, level + 1);
                });
        }

        return html;
    }

    attachEventListeners() {
        // File/folder click handler
        this.container.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;

            const type = fileItem.dataset.type;
            const id = fileItem.dataset.id;

            if (type === 'file') {
                this.loadFile(id);
            } else {
                this.toggleFolder(fileItem);
            }
        });

        // Show/hide actions on hover
        this.container.addEventListener('mouseover', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                const actions = fileItem.querySelector('.file-actions');
                actions?.classList.remove('hidden');
            }
        });

        this.container.addEventListener('mouseout', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (fileItem) {
                const actions = fileItem.querySelector('.file-actions');
                actions?.classList.add('hidden');
            }
        });

        // Rename handler
        this.container.addEventListener('click', async (e) => {
            if (e.target.closest('.rename-file')) {
                const fileItem = e.target.closest('.file-item');
                const nameElement = fileItem.querySelector('.file-name');
                const oldName = nameElement.textContent;
                const id = fileItem.dataset.id;

                const newName = prompt('Enter new name:', oldName);
                if (newName && newName !== oldName) {
                    try {
                        await this.renameFile(id, newName);
                        nameElement.textContent = newName;
                    } catch (error) {
                        alert('Failed to rename file');
                    }
                }
            }
        });

        // Delete handler
        this.container.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-file')) {
                const fileItem = e.target.closest('.file-item');
                const id = fileItem.dataset.id;
                const type = fileItem.dataset.type;

                if (confirm(`Are you sure you want to delete this ${type}?`)) {
                    try {
                        await this.deleteFile(id);
                        fileItem.remove();
                    } catch (error) {
                        alert('Failed to delete file');
                    }
                }
            }
        });
    }

    async fetchFiles() {
        const response = await fetch(`/files/project/${this.projectId}`);
        return await response.json();
    }

    async loadFile(id) {
        try {
            const response = await fetch(`/files/${id}`);
            const file = await response.json();
            window.monacoEditor.setValue(file.content);
            this.selectedFile = id;
            
            // Update language if available
            const languageSelect = document.getElementById('languageSelect');
            if (languageSelect && file.language) {
                languageSelect.value = file.language;
                window.monacoEditor.setLanguage(file.language);
            }
        } catch (error) {
            console.error('Error loading file:', error);
            alert('Failed to load file');
        }
    }

    async renameFile(id, newName) {
        const response = await fetch(`/files/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: newName })
        });

        if (!response.ok) {
            throw new Error('Failed to rename file');
        }
    }

    async deleteFile(id) {
        const response = await fetch(`/files/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete file');
        }
    }

    toggleFolder(folderElement) {
        const isOpen = folderElement.classList.toggle('open');
        const icon = folderElement.querySelector('.fas');
        icon.classList.toggle('fa-folder', !isOpen);
        icon.classList.toggle('fa-folder-open', isOpen);
        
        // Toggle visibility of children
        const path = folderElement.dataset.path;
        const children = this.container.querySelectorAll(`[data-path^="${path}/"]`);
        children.forEach(child => {
            child.classList.toggle('hidden', !isOpen);
        });
    }
} 