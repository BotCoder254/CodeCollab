// public/js/editor.js
class CodeEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.socket = io();
        this.projectId = options.projectId;
        this.userId = options.userId;
        this.cursors = new Map();

        this.init();
    }

    async init() {
        await this.initMonaco();
        this.setupSocketListeners();
        this.setupEditorListeners();
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
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: 'on'
                });

                resolve();
            });
        });
    }

    setupSocketListeners() {
        this.socket.emit('join-room', this.projectId);

        this.socket.on('code-update', (data) => {
            if (data.userId !== this.userId) {
                const position = this.editor.getPosition();
                this.editor.setValue(data.content);
                this.editor.setPosition(position);
            }
        });

        this.socket.on('cursor-update', (data) => {
            if (data.userId !== this.userId) {
                this.updateRemoteCursor(data);
            }
        });
    }

    setupEditorListeners() {
        let debounceTimeout;

        this.editor.onDidChangeModelContent(() => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.socket.emit('code-change', {
                    roomId: this.projectId,
                    content: this.editor.getValue(),
                    userId: this.userId
                });
            }, 100);
        });

        this.editor.onDidChangeCursorPosition((e) => {
            this.socket.emit('cursor-move', {
                roomId: this.projectId,
                userId: this.userId,
                position: e.position
            });
        });
    }

    updateRemoteCursor(data) {
        const existingDecorations = this.cursors.get(data.userId) || [];

        const decorations = this.editor.deltaDecorations(existingDecorations, [{
            range: new monaco.Range(
                data.position.lineNumber,
                data.position.column,
                data.position.lineNumber,
                data.position.column
            ),
            options: {
                className: `cursor-${data.userId}`,
                hoverMessage: { value: `Cursor: User ${data.userId}` }
            }
        }]);

        this.cursors.set(data.userId, decorations);
    }

    setValue(content) {
        this.editor.setValue(content);
    }

    getValue() {
        return this.editor.getValue();
    }
}

// Add custom styles for remote cursors
const style = document.createElement('style');
document.head.appendChild(style);
style.textContent = `
    .remote-cursor {
      background-color: rgba(250, 166, 26, 0.5);
      width: 2px !important;
    }
  `;