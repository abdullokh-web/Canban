// DOM Elements & Optimization caching
const boardElement = document.getElementById('board');
const themeToggleBtn = document.getElementById('theme-toggle');
const langSelector = document.getElementById('lang-selector');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const btnCancel = document.getElementById('btn-cancel');
const toastContainer = document.getElementById('toast-container');
const searchInput = document.getElementById('search-input');
const btnClearDone = document.getElementById('btn-clear-done');

// Modal Inputs
const taskIdInput = document.getElementById('task-id');
const taskStatusInput = document.getElementById('task-status');
const taskTitleInput = document.getElementById('task-title-input');
const taskDescInput = document.getElementById('task-desc-input');
const taskPriorityInput = document.getElementById('task-priority-input');

// Drag and Drop state
let draggedTaskElement = null;
let sourceColumnId = null;

/**
 * Applies the current language settings to the UI.
 */
function applyTranslations() {
    const state = getState();
    const lang = state.settings.lang;

    // Document elements
    document.getElementById('ui-app-title').textContent = t(lang, 'app_title');
    document.getElementById('ui-todo').textContent = t(lang, 'todo');
    document.getElementById('ui-doing').textContent = t(lang, 'doing');
    document.getElementById('ui-done').textContent = t(lang, 'done');

    // Add task buttons
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.textContent = t(lang, 'add_task');
    });

    // Form placeholders and options
    taskTitleInput.placeholder = t(lang, 'task_title_placeholder');
    taskDescInput.placeholder = t(lang, 'task_desc_placeholder');

    document.getElementById('ui-priority-low').textContent = t(lang, 'priority_low');
    document.getElementById('ui-priority-medium').textContent = t(lang, 'priority_medium');
    document.getElementById('ui-priority-high').textContent = t(lang, 'priority_high');

    document.getElementById('btn-cancel').textContent = t(lang, 'cancel');
    document.getElementById('btn-save').textContent = t(lang, 'save');
    document.getElementById('ui-creator').textContent = t(lang, 'creator');

    // Controls
    searchInput.placeholder = t(lang, 'search_placeholder');
    searchInput.setAttribute('aria-label', t(lang, 'search_placeholder'));

    btnClearDone.title = t(lang, 'clear_done');
    btnClearDone.setAttribute('aria-label', t(lang, 'clear_done'));

    // Language selector value should match
    langSelector.value = lang;
}

/**
 * Applies the theme setting to the document.
 */
function applyTheme() {
    const state = getState();
    document.documentElement.setAttribute('data-theme', state.settings.theme);
}

/**
 * Renders the entire board securely leveraging Fragment rendering for perf.
 * @param {string} searchQuery Optional search value to filter
 */
function renderBoard(searchQuery = "") {
    const state = getState();
    const lang = state.settings.lang;
    const query = searchQuery.toLowerCase().trim();

    ['todo', 'doing', 'done'].forEach(colId => {
        const listEl = document.getElementById(`list-${colId}`);
        listEl.innerHTML = ''; // Fast DOM clear

        let tasks = state.columns[colId];

        // Filter tasks dynamically
        if (query) {
            tasks = tasks.filter(task => {
                const titleStr = String(task.title || '').toLowerCase();
                const descStr = String(task.desc || '').toLowerCase();
                return titleStr.includes(query) || descStr.includes(query);
            });
        }

        document.getElementById(`count-${colId}`).textContent = tasks.length;

        if (tasks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-placeholder';
            empty.textContent = t(lang, 'empty_column');
            listEl.appendChild(empty);
            return;
        }

        const fragment = document.createDocumentFragment();

        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'kanban-card card-enter';
            card.setAttribute('draggable', 'true');
            card.setAttribute('role', 'listitem');
            card.dataset.id = task.id;
            card.dataset.col = colId;

            let priorityClass = 'priority-medium';
            if (task.priority === 'low') priorityClass = 'priority-low';
            if (task.priority === 'high') priorityClass = 'priority-high';

            const priorityText = t(lang, `priority_${task.priority}`);

            card.innerHTML = `
                <div class="card-title">${escapeHTML(task.title)}</div>
                ${task.desc ? `<div class="card-desc">${escapeHTML(task.desc)}</div>` : ''}
                <div class="card-footer">
                    <span class="priority-badge ${priorityClass}">${priorityText}</span>
                    <div class="card-actions">
                        <button class="btn-edit" title="${t(lang, 'edit_task')}" aria-label="Edit Task">✏️</button>
                        <button class="btn-delete" title="${t(lang, 'delete_task')}" aria-label="Delete Task">🗑️</button>
                    </div>
                </div>
            `;

            fragment.appendChild(card);
        });

        listEl.appendChild(fragment);
    });
}

/**
 * Shows a toast notification.
 */
function showToast(message, icon = '✅') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // Wait for transition out
    }, 3000);
}

/**
 * Opens task modal for creation or editing.
 */
function openModal(colId, task = null) {
    taskStatusInput.value = colId;

    if (task) {
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDescInput.value = task.desc || '';
        taskPriorityInput.value = task.priority || 'medium';
    } else {
        taskIdInput.value = '';
        taskTitleInput.value = '';
        taskDescInput.value = '';
        taskPriorityInput.value = 'medium';
    }

    taskModal.classList.add('active');
    taskModal.setAttribute('aria-hidden', 'false');

    // Focus after animation
    setTimeout(() => taskTitleInput.focus(), 100);
}

/**
 * Closes the task modal.
 */
function closeModal() {
    taskModal.classList.remove('active');
    taskModal.setAttribute('aria-hidden', 'true');
    setTimeout(() => taskForm.reset(), 400);
}


/**
 * Drag and Drop Helpers
 */
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * General setup & Event Delegation
 */
function init() {
    // Initial UI load
    applyTheme();
    applyTranslations();
    renderBoard();

    // --- Global Controls ---
    themeToggleBtn.addEventListener('click', () => {
        const state = getState();
        const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
        updateTheme(newTheme);
        applyTheme();
    });

    langSelector.addEventListener('change', (e) => {
        updateLanguage(e.target.value);
        applyTranslations();
        renderBoard(searchInput.value);
    });

    searchInput.addEventListener('input', (e) => {
        renderBoard(e.target.value);
    });

    btnClearDone.addEventListener('click', () => {
        const lang = getState().settings.lang;
        if (confirm(t(lang, 'confirm_clear_done'))) {
            clearColumn('done');
            renderBoard(searchInput.value);
            showToast(t(lang, 'clear_done') + '!', '🧹');
        }
    });

    // --- Modal Controls ---
    btnCancel.addEventListener('click', closeModal);

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const colId = taskStatusInput.value;
        const taskId = taskIdInput.value; // It is a string now (UUID usually)

        const taskData = {
            title: taskTitleInput.value.trim(),
            desc: taskDescInput.value.trim(),
            priority: taskPriorityInput.value
        };

        const lang = getState().settings.lang;

        if (taskId) {
            updateTask(colId, taskId, taskData);
            showToast(t(lang, 'save') + '!');
        } else {
            addTask(colId, taskData);
            showToast(t(lang, 'add_task') + '!');
        }

        closeModal();
        renderBoard(searchInput.value);
    });

    // Keyboard & Accessibility Support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && taskModal.classList.contains('active')) {
            closeModal();
        }
    });

    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });

    // --- Event Delegation on the Main Board ---
    // Handles Drag initiation, Clicks for edit/delete, and adding tasks without attaching 100s of listeners.
    boardElement.addEventListener('click', (e) => {
        const lang = getState().settings.lang;

        // Match Add Task Button
        if (e.target.closest('.add-task-btn')) {
            const btn = e.target.closest('.add-task-btn');
            openModal(btn.dataset.status);
            return;
        }

        // Match Edit Button
        if (e.target.closest('.btn-edit')) {
            const card = e.target.closest('.kanban-card');
            const task = getTask(card.dataset.col, card.dataset.id);
            if (task) openModal(card.dataset.col, task);
            return;
        }

        // Match Delete Button
        if (e.target.closest('.btn-delete')) {
            const card = e.target.closest('.kanban-card');
            if (confirm(t(lang, 'delete_task') + '?')) {
                deleteTask(card.dataset.col, card.dataset.id);
                renderBoard(searchInput.value);
                showToast(t(lang, 'delete_task') + '!', '🗑️');
            }
            return;
        }
    });

    // --- Native Drag & Drop ---
    // Drag Start (Delegated)
    boardElement.addEventListener('dragstart', (e) => {
        const card = e.target.closest('.kanban-card');
        if (!card) return;

        draggedTaskElement = card;
        sourceColumnId = card.dataset.col;

        // Async add dragging class for visual styling
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.dataset.id);
    });

    // Drag End (Delegated)
    boardElement.addEventListener('dragend', (e) => {
        const card = e.target.closest('.kanban-card');
        if (card) card.classList.remove('dragging');

        document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
        draggedTaskElement = null;
        sourceColumnId = null;
    });

    // Drag Over (Delegated)
    boardElement.addEventListener('dragover', e => {
        const col = e.target.closest('.kanban-column');
        if (!col || !draggedTaskElement) return;

        e.preventDefault(); // Enable dropping
        col.classList.add('drag-over');

        const listEl = col.querySelector('.task-list');
        const afterElement = getDragAfterElement(listEl, e.clientY);

        if (afterElement == null) {
            listEl.appendChild(draggedTaskElement);
        } else {
            listEl.insertBefore(draggedTaskElement, afterElement);
        }
    });

    // Drag Leave (Delegated)
    boardElement.addEventListener('dragleave', e => {
        const col = e.target.closest('.kanban-column');
        if (!col) return;

        // Ensure we are leaving the column itself, not children
        if (!col.contains(e.relatedTarget)) {
            col.classList.remove('drag-over');
        }
    });

    // Drop (Delegated)
    boardElement.addEventListener('drop', e => {
        const col = e.target.closest('.kanban-column');
        if (!col || !draggedTaskElement) return;

        e.preventDefault();
        col.classList.remove('drag-over');

        const taskId = draggedTaskElement.dataset.id;
        const targetColumnId = col.dataset.status;

        // Determine the next card in the DOM to act as an absolute anchor
        const nextCard = draggedTaskElement.nextElementSibling;
        let afterTaskId = null;
        if (nextCard && nextCard.classList.contains('kanban-card')) {
            afterTaskId = nextCard.dataset.id;
        }

        moveTask(sourceColumnId, targetColumnId, taskId, afterTaskId);

        // Only force re-render if we are manipulating state during a search filter 
        // since native DOM repositioning loses sync with filtered views
        if (searchInput.value.trim() !== '') {
            renderBoard(searchInput.value);
        } else {
            // Otherwise natively handle DOM attribute shifting to preserve animation states natively
            draggedTaskElement.dataset.col = targetColumnId;
            ['todo', 'doing', 'done'].forEach(id => {
                document.getElementById(`count-${id}`).textContent = getState().columns[id].length;
            });
        }
    });
}

// Utility: simple HTML escaper to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Boot application
init();
