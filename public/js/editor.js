// public/js/editor.js



let editor;

let currentFile = null;

const socket = io();

const openFiles = new Map();



// Initialize editor when the page loads

document.addEventListener('DOMContentLoaded', () => {

    initializeMonacoEditor();

    setupWebSocket();

    setupEventListeners();

    loadFileTree();

});



async function initializeMonacoEditor() {

    showLoading();

    try {

        editor = await monaco.editor.create(document.getElementById('monacoEditor'), {

            theme: 'vs-dark',

            fontSize: 14,

            minimap: { enabled: true },

            automaticLayout: true,

            scrollBeyondLastLine: false,

            language: 'javascript'

        });

        

        // Add editor change listener

        editor.onDidChangeModelContent(() => {

            if (currentFile) {

                const content = editor.getValue();

                socket.emit('code-change', {

                    roomId: getProjectId(),

                    content,

                    fileId: currentFile

                });

            }

        });

    } catch (error) {

        showNotification('Failed to initialize editor', 'error');

    } finally {

        hideLoading();

    }

}



function setupEventListeners() {

    document.getElementById('saveBtn').addEventListener('click', saveCurrentFile);

    document.getElementById('newFileBtn').addEventListener('click', showNewFileModal);

    document.getElementById('createNewFile').addEventListener('click', createNewFile);

    document.getElementById('cancelNewFile').addEventListener('click', hideNewFileModal);

}



async function loadFileTree() {

    showLoading();

    try {

        const projectId = getProjectId();

        const response = await fetch(`/api/projects/${projectId}/files`);

        const files = await response.json();

        

        const fileList = document.getElementById('fileList');

        fileList.innerHTML = '';

        

        files.forEach(file => {

            const fileElement = createFileElement(file);

            fileList.appendChild(fileElement);

        });

    } catch (error) {

        showNotification('Failed to load files', 'error');

    } finally {

        hideLoading();

    }

}



function createFileElement(file) {

    const div = document.createElement('div');

    div.className = 'file-item';

    div.innerHTML = `

        <span class="flex-1">${file.name}</span>

        <button class="delete-file opacity-0 hover:opacity-100">×</button>

    `;

    

    div.addEventListener('click', () => openFile(file._id));

    div.querySelector('.delete-file').addEventListener('click', (e) => {

        e.stopPropagation();

        deleteFile(file._id);

    });

    

    return div;

}



async function openFile(fileId) {

    showLoading();

    try {

        const response = await fetch(`/api/files/${fileId}`);

        const file = await response.json();

        

        // Set editor language based on file extension

        const language = getLanguageFromFileName(file.name);

        monaco.editor.setModelLanguage(editor.getModel(), language);

        

        // Update editor content

        editor.setValue(file.content);

        currentFile = fileId;

        

        // Add tab

        addEditorTab(file);

        

        // Update active file in tree

        updateActiveFile(fileId);

    } catch (error) {

        showNotification('Failed to open file', 'error');

    } finally {

        hideLoading();

    }

}



async function saveCurrentFile() {

    if (!currentFile) return;

    

    showLoading();

    try {

        const content = editor.getValue();

        const response = await fetch(`/api/files/${currentFile}`, {

            method: 'PUT',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({ content })

        });

        

        if (response.ok) {

            showNotification('File saved successfully');

        } else {

            throw new Error('Failed to save file');

        }

    } catch (error) {

        showNotification('Error saving file', 'error');

    } finally {

        hideLoading();

    }

}



// Utility functions

function showLoading() {

    document.getElementById('loadingOverlay').classList.remove('hidden');

}



function hideLoading() {

    document.getElementById('loadingOverlay').classList.add('hidden');

}



function showNotification(message, type = 'success') {

    const notification = document.getElementById('notification');

    notification.className = `notification notification-${type}`;

    notification.textContent = message;

    notification.classList.remove('hidden');

    

    setTimeout(() => {

        notification.classList.add('hidden');

    }, 3000);

}



function getProjectId() {

    return window.location.pathname.split('/')[2];

}



function getLanguageFromFileName(filename) {

    const ext = filename.split('.').pop().toLowerCase();

    const languageMap = {

        'js': 'javascript',

        'py': 'python',

        'html': 'html',

        'css': 'css',

        'json': 'json',

        // Add more mappings as needed

    };

    return languageMap[ext] || 'plaintext';

}



function showNewFileModal() {

    document.getElementById('newFileModal').classList.remove('hidden');

    document.getElementById('newFileName').focus();

}



function hideNewFileModal() {

    document.getElementById('newFileModal').classList.add('hidden');

    document.getElementById('newFileName').value = '';

}



async function createNewFile() {

    const fileName = document.getElementById('newFileName').value.trim();

    if (!fileName) {

        showNotification('File name is required', 'error');

        return;

    }



    showLoading();

    try {

        const projectId = getProjectId();

        const response = await fetch('/api/files', {

            method: 'POST',

            headers: { 'Content-Type': 'application/json' },

            body: JSON.stringify({

                name: fileName,

                content: '',

                projectId

            })

        });



        if (!response.ok) throw new Error('Failed to create file');



        const file = await response.json();

        const fileElement = createFileElement(file);

        document.getElementById('fileList').appendChild(fileElement);

        

        hideNewFileModal();

        showNotification('File created successfully');

        

        // Notify other users

        socket.emit('file-created', {

            roomId: projectId,

            file

        });

        

        // Open the new file

        openFile(file._id);

    } catch (error) {

        showNotification('Failed to create file', 'error');

    } finally {

        hideLoading();

    }

}



async function deleteFile(fileId) {

    if (!confirm('Are you sure you want to delete this file?')) return;



    showLoading();

    try {

        const response = await fetch(`/api/files/${fileId}`, {

            method: 'DELETE'

        });



        if (!response.ok) throw new Error('Failed to delete file');



        // Remove file from UI

        const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);

        if (fileElement) fileElement.remove();



        // Close tab if open

        closeFileTab(fileId);

        

        showNotification('File deleted successfully');

        

        // Notify other users

        socket.emit('file-deleted', {

            roomId: getProjectId(),

            fileId

        });

    } catch (error) {

        showNotification('Failed to delete file', 'error');

    } finally {

        hideLoading();

    }

}



function addEditorTab(file) {

    const tabBar = document.getElementById('tabBar');

    const existingTab = document.querySelector(`[data-tab-id="${file._id}"]`);

    

    if (existingTab) {

        activateTab(existingTab);

        return;

    }



    const tab = document.createElement('div');

    tab.className = 'editor-tab';

    tab.setAttribute('data-tab-id', file._id);

    tab.innerHTML = `

        <span>${file.name}</span>

        <button class="tab-close ml-2">×</button>

    `;



    tab.querySelector('.tab-close').addEventListener('click', (e) => {

        e.stopPropagation();

        closeFileTab(file._id);

    });



    tabBar.appendChild(tab);

    activateTab(tab);

}



function activateTab(tab) {

    document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));

    tab.classList.add('active');

}



function closeFileTab(fileId) {

    const tab = document.querySelector(`[data-tab-id="${fileId}"]`);

    if (!tab) return;



    if (currentFile === fileId) {

        currentFile = null;

        editor.setValue('');

    }



    tab.remove();

}



function updateActiveFile(fileId) {

    document.querySelectorAll('.file-item').forEach(item => {

        item.classList.remove('active');

        if (item.getAttribute('data-file-id') === fileId) {

            item.classList.add('active');

        }

    });

}



// Add WebSocket listeners for file updates

socket.on('file-update', (data) => {

    if (data.type === 'created') {

        const fileElement = createFileElement(data.file);

        document.getElementById('fileList').appendChild(fileElement);

    } else if (data.type === 'deleted') {

        const fileElement = document.querySelector(`[data-file-id="${data.fileId}"]`);

        if (fileElement) fileElement.remove();

        closeFileTab(data.fileId);

    }

});


