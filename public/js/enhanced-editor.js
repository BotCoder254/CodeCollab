class EnhancedEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.editor = null;
        this.socket = io();
        this.cursors = new Map();
        this.currentFile = null;
        this.autoSaveTimeout = null;
        this.init();
    }

    async init() {
        await this.initMonaco();
        this.setupSocketListeners();
        this.setupEditorListeners();
        this.setupTerminal();
        this.joinRoom();
    }

    async initMonaco() {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' } });

        return new Promise((resolve) => {
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(this.container, {
                    value: '',
                    language: 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    cursorStyle: 'line',
                    wordWrap: 'on',
                    folding: true,
                    suggestOnTriggerCharacters: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    snippetSuggestions: 'inline',
                    multiCursorModifier: 'ctrlCmd',
                    accessibilitySupport: 'auto',
                    autoIndent: 'full',
                    bracketPairColorization: { enabled: true }
                });

                // Add custom actions
                this.addCustomActions();
                resolve();
            });
        });
    }

    setupSocketListeners() {
        this.socket.on('cursor-update', (data) => {
            if (data.userId !== this.options.userId) {
                this.updateRemoteCursor(data);
            }
        });

        this.socket.on('code-update', (data) => {
            if (data.userId !== this.options.userId) {
                const position = this.editor.getPosition();
                this.editor.setValue(data.content);
                this.editor.setPosition(position);
            }
        });

        this.socket.on('user-joined', (data) => {
            this.addActiveUser(data.username);
            showNotification(`${data.username} joined the session`, 'info');
        });

        this.socket.on('user-left', (data) => {
            this.removeActiveUser(data.username);
            this.removeCursor(data.userId);
            showNotification(`${data.username} left the session`, 'info');
        });
    }

    setupEditorListeners() {
        // Content change
        this.editor.onDidChangeModelContent((e) => {
            clearTimeout(this.autoSaveTimeout);
            document.getElementById('lastSaved').textContent = 'Unsaved changes';

            this.socket.emit('code-change', {
                roomId: this.options.projectId,
                content: this.editor.getValue(),
                userId: this.options.userId
            });

            // Auto-save after 1 second of no changes
            this.autoSaveTimeout = setTimeout(() => this.saveContent(), 1000);
        });

        // Cursor position
        this.editor.onDidChangeCursorPosition((e) => {
            this.socket.emit('cursor-move', {
                roomId: this.options.projectId,
                userId: this.options.userId,
                username: this.options.username,
                position: e.position
            });

            this.updateCursorPosition(e.position);
        });

        // Selection change
        this.editor.onDidChangeCursorSelection((e) => {
            if (e.selection.startLineNumber !== e.selection.endLineNumber ||
                e.selection.startColumn !== e.selection.endColumn) {
                this.socket.emit('selection-change', {
                    roomId: this.options.projectId,
                    userId: this.options.userId,
                    selection: e.selection
                });
            }
        });
    }

    setupTerminal() {
        const terminal = document.getElementById('terminal');
        if (!terminal) return;

        // Basic terminal emulation
        const terminalOutput = document.createElement('div');
        terminal.appendChild(terminalOutput);

        const terminalInput = document.createElement('input');
        terminalInput.type = 'text';
        terminalInput.className = 'w-full bg-transparent outline-none';
        terminal.appendChild(terminalInput);

        terminalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = e.target.value;
                this.executeCommand(command, terminalOutput);
                e.target.value = '';
            }
        });
    }

    async executeCommand(command, output) {
        const commandDiv = document.createElement('div');
        commandDiv.textContent = `> ${command}`;
        output.appendChild(commandDiv);

        try {
            const response = await fetch('/terminal/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const result = await response.json();
            const resultDiv = document.createElement('div');
            resultDiv.textContent = result.output;
            output.appendChild(resultDiv);
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.textContent = 'Error executing command';
            errorDiv.className = 'text-red-500';
            output.appendChild(errorDiv);
        }

        output.scrollTop = output.scrollHeight;
    }

    addCustomActions() {
        // Save action
        this.editor.addAction({
            id: 'save',
            label: 'Save',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => this.saveContent()
        });

        // Format document
        this.editor.addAction({
            id: 'format',
            label: 'Format Document',
            keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
            run: () => this.formatDocument()
        });

        // Toggle terminal
        this.editor.addAction({
            id: 'toggle-terminal',
            label: 'Toggle Terminal',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Backquote],
            run: () => this.toggleTerminal()
        });
    }

    async saveContent() {
        if (!this.currentFile) return;

        try {
            const response = await fetch(`/files/${this.currentFile}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: this.editor.getValue() })
            });

            if (response.ok) {
                document.getElementById('lastSaved').textContent = 'Saved';
                showNotification('File saved successfully', 'success');
            } else {
                throw new Error('Failed to save file');
            }
        } catch (error) {
            console.error('Error saving file:', error);
            showNotification('Failed to save file', 'error');
        }
    }

    formatDocument() {
        this.editor.getAction('editor.action.formatDocument').run();
    }

    toggleTerminal() {
        const terminal = document.getElementById('terminal');
        if (terminal) {
            terminal.classList.toggle('hidden');
        }
    }

    setTheme(theme) {
        monaco.editor.setTheme(theme);
    }

    setLanguage(language) {
        monaco.editor.setModelLanguage(this.editor.getModel(), language);
    }

    updateCursorPosition(position) {
        const cursorPosition = document.getElementById('cursorPosition');
        if (cursorPosition) {
            cursorPosition.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
        }
    }

    addActiveUser(username) {
        const activeUsers = document.getElementById('activeUsers');
        if (!activeUsers) return;

        const userElement = document.createElement('div');
        userElement.className = 'w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium';
        userElement.textContent = username.charAt(0).toUpperCase();
        userElement.title = username;
        userElement.dataset.username = username;

        activeUsers.appendChild(userElement);
    }

    removeActiveUser(username) {
        const activeUsers = document.getElementById('activeUsers');
        if (!activeUsers) return;

        const userElement = activeUsers.querySelector(`[data-username="${username}"]`);
        if (userElement) {
            userElement.remove();
        }
    }

    joinRoom() {
        this.socket.emit('join-room', {
            roomId: this.options.projectId,
            userId: this.options.userId,
            username: this.options.username
        });
    }
}

// Initialize editor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const editor = new EnhancedEditor('monacoEditor', {
        projectId: document.querySelector('[data-project-id]').dataset.projectId,
        userId: document.querySelector('[data-user-id]').dataset.userId,
        username: document.querySelector('[data-username]').dataset.username
    });
}); 