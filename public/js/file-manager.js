class FileManager {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.projectId = options.projectId;
        this.currentPath = '/';
        this.fileTree = {};
        this.init();
    }

    async init() {
        await this.loadFiles();
        this.setupEventListeners();
    }

    async loadFiles() {
        try {
            const response = await fetch(`/files/project/${this.projectId}`);
            const files = await response.json();
            this.fileTree = this.buildFileTree(files);
            this.render();
        } catch (error) {
            console.error('Error loading files:', error);
            showNotification('Failed to load files', 'error');
        }
    }

    buildFileTree(files) {
        const root = { type: 'folder', name: 'root', children: {}, path: '/' };
        
        files.forEach(file => {
            const parts = file.path.split('/').filter(p => p);
            let current = root;
            
            parts.forEach((part, index) => {
                if (!current.children[part]) {
                    current.children[part] = {
                        id: file._id,
                        type: index === parts.length - 1 ? file.type : 'folder',
                        name: part,
                        children: {},
                        path: '/' + parts.slice(0, index + 1).join('/'),
                        language: file.language
                    };
                }
                current = current.children[part];
            });
        });
        
        return root;
    }

    render() {
        this.container.innerHTML = this.generateFileTreeHTML(this.fileTree);
        this.initializeDragAndDrop();
    }

    generateFileTreeHTML(node, level = 0) {
        const indent = level * 20;
        let html = '';

        if (level > 0) {
            html += `
                <div class="file-item" 
                     data-id="${node.id || ''}"
                     data-path="${node.path}"
                     data-type="${node.type}"
                     draggable="true"
                     style="padding-left: ${indent}px">
                    <div class="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer">
                        <i class="fas ${this.getFileIcon(node)} text-gray-400"></i>
                        <span class="file-name">${node.name}</span>
                        <div class="file-actions hidden ml-auto">
                            <button class="rename-file p-1 hover:text-indigo-400" title="Rename">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-file p-1 hover:text-red-400" title="Delete">
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
                    html += this.generateFileTreeHTML(child, level + 1);
                });
        }

        return html;
    }

    getFileIcon(node) {
        if (node.type === 'folder') return 'fa-folder';
        
        const iconMap = {
            'javascript': 'fa-js',
            'html': 'fa-html5',
            'css': 'fa-css3',
            'python': 'fa-python',
            'java': 'fa-java',
            'markdown': 'fa-markdown'
        };

        return iconMap[node.language] || 'fa-file-code';
    }

    setupEventListeners() {
        // File/folder click
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

        // Show/hide actions
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
                await this.handleRename(fileItem);
            }
        });

        // Delete handler
        this.container.addEventListener('click', async (e) => {
            if (e.target.closest('.delete-file')) {
                const fileItem = e.target.closest('.file-item');
                await this.handleDelete(fileItem);
            }
        });
    }

    initializeDragAndDrop() {
        const items = this.container.querySelectorAll('.file-item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.path);
                item.classList.add('opacity-50');
            });

            item.addEventListener('dragend', (e) => {
                item.classList.remove('opacity-50');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (item.dataset.type === 'folder') {
                    item.classList.add('bg-gray-700');
                }
            });

            item.addEventListener('dragleave', (e) => {
                item.classList.remove('bg-gray-700');
            });

            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                item.classList.remove('bg-gray-700');
                
                const sourcePath = e.dataTransfer.getData('text/plain');
                const targetPath = item.dataset.path;
                
                if (sourcePath !== targetPath) {
                    await this.moveFile(sourcePath, targetPath);
                }
            });
        });
    }

    async handleRename(fileItem) {
        const nameElement = fileItem.querySelector('.file-name');
        const oldName = nameElement.textContent;
        const id = fileItem.dataset.id;

        const newName = prompt('Enter new name:', oldName);
        if (newName && newName !== oldName) {
            try {
                const response = await fetch(`/files/${id}/rename`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: newName })
                });

                if (response.ok) {
                    nameElement.textContent = newName;
                    showNotification('File renamed successfully', 'success');
                } else {
                    throw new Error('Failed to rename file');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('Failed to rename file', 'error');
            }
        }
    }

    async handleDelete(fileItem) {
        const id = fileItem.dataset.id;
        const type = fileItem.dataset.type;

        if (confirm(`Are you sure you want to delete this ${type}?`)) {
            try {
                const response = await fetch(`/files/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    fileItem.remove();
                    showNotification(`${type} deleted successfully`, 'success');
                } else {
                    throw new Error(`Failed to delete ${type}`);
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification(`Failed to delete ${type}`, 'error');
            }
        }
    }

    async moveFile(sourcePath, targetPath) {
        try {
            const response = await fetch(`/files/move`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sourcePath,
                    targetPath,
                    projectId: this.projectId
                })
            });

            if (response.ok) {
                await this.loadFiles(); // Reload file tree
                showNotification('File moved successfully', 'success');
            } else {
                throw new Error('Failed to move file');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('Failed to move file', 'error');
        }
    }

    async loadFile(id) {
        try {
            const response = await fetch(`/files/${id}`);
            const file = await response.json();
            window.editor.setValue(file.content);
            window.editor.setLanguage(file.language);
            showNotification('File loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading file:', error);
            showNotification('Failed to load file', 'error');
        }
    }

    toggleFolder(folderElement) {
        folderElement.classList.toggle('open');
        const icon = folderElement.querySelector('.fas');
        icon.classList.toggle('fa-folder');
        icon.classList.toggle('fa-folder-open');
        
        const path = folderElement.dataset.path;
        const children = this.container.querySelectorAll(`[data-path^="${path}/"]`);
        children.forEach(child => {
            child.classList.toggle('hidden');
        });
    }
} 