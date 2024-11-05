require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs'
    }
});

class CursorManager {
    constructor(editor) {
        this.editor = editor;
        this.cursors = new Map();
        this.decorations = new Map();
        this.colors = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', 
            '#FF00FF', '#00FFFF', '#FFA500', '#800080'
        ];
        this.colorIndex = 0;
    }

    addCursor(userId, username) {
        if (!this.cursors.has(userId)) {
            this.cursors.set(userId, {
                color: this.colors[this.colorIndex % this.colors.length],
                username: username
            });
            this.colorIndex++;
        }
    }

    updateCursor(userId, position) {
        if (!this.cursors.has(userId)) return;

        const cursorData = this.cursors.get(userId);
        const decorations = this.decorations.get(userId) || [];

        // Remove old decorations
        this.editor.deltaDecorations(decorations, []);

        // Create new decoration
        const newDecorations = [{
            range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column + 1
            ),
            options: {
                className: `cursor-${userId}`,
                hoverMessage: { value: cursorData.username },
                beforeContentClassName: 'cursor-overlay',
                afterContentClassName: 'cursor-overlay'
            }
        }];

        // Add cursor label
        newDecorations.push({
            range: new monaco.Range(
                position.lineNumber,
                position.column,
                position.lineNumber,
                position.column
            ),
            options: {
                afterContent: {
                    content: ` ${cursorData.username}`,
                },
                afterContentClassName: 'cursor-label',
                className: `cursor-label-${userId}`
            }
        });

        // Update decorations
        const newDecorationsIds = this.editor.deltaDecorations([], newDecorations);
        this.decorations.set(userId, newDecorationsIds);

        // Add styles for this cursor if not already added
        this.addCursorStyles(userId, cursorData.color);
    }

    removeCursor(userId) {
        if (this.decorations.has(userId)) {
            this.editor.deltaDecorations(this.decorations.get(userId), []);
            this.decorations.delete(userId);
            this.cursors.delete(userId);
        }
    }

    addCursorStyles(userId, color) {
        const styleId = `cursor-style-${userId}`;
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .cursor-${userId} {
                    background-color: ${color}40;
                    border-left: 2px solid ${color};
                }
                .cursor-label-${userId} {
                    background-color: ${color};
                    color: white;
                    padding: 2px 4px;
                    border-radius: 2px;
                    font-size: 12px;
                    pointer-events: none;
                }
                .cursor-overlay {
                    position: relative;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

class MonacoEditorSetup {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = options;
        this.editor = null;
        this.cursorManager = null;
        this.init();
    }

    async init() {
        return new Promise((resolve) => {
            require(['vs/editor/editor.main'], () => {
                this.editor = monaco.editor.create(this.container, {
                    value: this.options.initialContent || '',
                    language: this.options.language || 'javascript',
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: true },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    readOnly: false,
                    cursorStyle: 'line',
                    wordWrap: 'on',
                    folding: true,
                    lineDecorationsWidth: 0,
                    renderValidationDecorations: 'on',
                    suggestOnTriggerCharacters: true,
                    snippetSuggestions: 'inline',
                    formatOnPaste: true,
                    formatOnType: true
                });

                // Add custom actions
                this.addCustomActions();

                // Setup event listeners
                this.setupEventListeners();

                this.cursorManager = new CursorManager(this.editor);

                resolve(this.editor);
            });
        });
    }

    addCustomActions() {
        // Add save action
        this.editor.addAction({
            id: 'save',
            label: 'Save',
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS
            ],
            run: () => {
                if (this.options.onSave) {
                    this.options.onSave(this.editor.getValue());
                }
            }
        });

        // Add format document action
        this.editor.addAction({
            id: 'format-document',
            label: 'Format Document',
            keybindings: [
                monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF
            ],
            run: () => {
                this.editor.getAction('editor.action.formatDocument').run();
            }
        });
    }

    setupEventListeners() {
        // Content change event
        this.editor.onDidChangeModelContent((event) => {
            if (this.options.onChange) {
                this.options.onChange(this.editor.getValue(), event);
            }
        });

        // Cursor position change event
        this.editor.onDidChangeCursorPosition((event) => {
            if (this.options.onCursorChange) {
                this.options.onCursorChange(event);
            }
        });
    }

    setValue(content) {
        if (this.editor) {
            this.editor.setValue(content);
        }
    }

    getValue() {
        return this.editor ? this.editor.getValue() : '';
    }

    setLanguage(language) {
        if (this.editor) {
            monaco.editor.setModelLanguage(this.editor.getModel(), language);
        }
    }

    formatDocument() {
        if (this.editor) {
            this.editor.getAction('editor.action.formatDocument').run();
        }
    }

    dispose() {
        if (this.editor) {
            this.editor.dispose();
        }
    }

    updateCursor(userId, position, username) {
        this.cursorManager.addCursor(userId, username);
        this.cursorManager.updateCursor(userId, position);
    }

    removeCursor(userId) {
        this.cursorManager.removeCursor(userId);
    }
} 