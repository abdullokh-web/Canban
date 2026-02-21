/**
 * core.js
 * High-performance state management utilizing immutable patterns.
 */

let boardData = loadData();

/**
 * Gets a deep copy of current entire board state to ensure immutability.
 * @returns {Object} Deep copy of the state object.
 */
function getState() {
    return JSON.parse(JSON.stringify(boardData));
}

/**
 * Internal persistence trigger.
 */
function persist() {
    saveData(boardData);
}

/**
 * Safely updates the theme setting.
 * @param {string} theme - "light" or "dark"
 */
function updateTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') return;
    boardData.settings.theme = theme;
    persist();
}

/**
 * Safely updates the language setting.
 * @param {string} lang - language code e.g., "en", "ru", "uz"
 */
function updateLanguage(lang) {
    const supported = ['en', 'ru', 'uz'];
    if (!supported.includes(lang)) return;
    boardData.settings.lang = lang;
    persist();
}

/**
 * Generates a crypto-safe unique ID if available, falling back to Date+Math.
 * @returns {string} 
 */
function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Adds a new task.
 * @param {string} columnId - Target column ('todo', 'doing', 'done').
 * @param {Object} taskData - Sanitized Task data.
 * @returns {Object} A copy of the created task.
 */
function addTask(columnId, taskData) {
    if (!boardData.columns[columnId]) return null;

    const newTask = {
        id: generateId(),
        title: taskData.title || "Untitled",
        desc: taskData.desc || "",
        priority: ['low', 'medium', 'high'].includes(taskData.priority) ? taskData.priority : 'medium',
        createdAt: Date.now()
    };

    // Immutable push
    boardData.columns[columnId] = [...boardData.columns[columnId], newTask];
    persist();

    return { ...newTask };
}

/**
 * Updates an exact task by replacing it immutably.
 * @param {string} columnId 
 * @param {string} taskId 
 * @param {Object} updatedData 
 * @returns {boolean} Success status
 */
function updateTask(columnId, taskId, updatedData) {
    const column = boardData.columns[columnId];
    if (!column) return false;

    const index = column.findIndex(t => String(t.id) === String(taskId));
    if (index === -1) return false;

    // Create a new array with the modified item (Immutability pattern)
    const newColumn = [...column];
    newColumn[index] = { ...newColumn[index], ...updatedData, updatedAt: Date.now() };

    boardData.columns[columnId] = newColumn;
    persist();
    return true;
}

/**
 * Deletes a task using immutable filter.
 * @param {string} columnId 
 * @param {string} taskId 
 */
function deleteTask(columnId, taskId) {
    if (!boardData.columns[columnId]) return;

    // Note: Use weak equality (==) or String() conversion to support both legacy Number IDs and new UUID String IDs.
    boardData.columns[columnId] = boardData.columns[columnId].filter(t => String(t.id) !== String(taskId));
    persist();
}

/**
 * Clears an entire column.
 * @param {string} columnId
 */
function clearColumn(columnId) {
    if (!boardData.columns[columnId]) return;
    boardData.columns[columnId] = [];
    persist();
}

/**
 * Gets a distinct copy of a task object.
 * @param {string} columnId 
 * @param {string} taskId 
 * @returns {Object|null}
 */
function getTask(columnId, taskId) {
    if (!boardData.columns[columnId]) return null;
    const task = boardData.columns[columnId].find(t => String(t.id) === String(taskId));
    return task ? { ...task } : null;
}

/**
 * Moves & reorders task using an anchor task ID for absolute precision.
 * @param {string} sourceColId 
 * @param {string} targetColId 
 * @param {string} taskId 
 * @param {string|null} afterTaskId - ID of the task that should be directly after the dropped task.
 */
function moveTask(sourceColId, targetColId, taskId, afterTaskId = null) {
    if (!boardData.columns[sourceColId] || !boardData.columns[targetColId]) return;

    let sourceCol = [...boardData.columns[sourceColId]];
    let targetCol = sourceColId === targetColId ? sourceCol : [...boardData.columns[targetColId]];

    const taskIndex = sourceCol.findIndex(t => String(t.id) === String(taskId));
    if (taskIndex === -1) return;

    // 1. Remove from source
    const [task] = sourceCol.splice(taskIndex, 1);

    // 2. Add to target at relative anchor
    let insertIndex = targetCol.length;
    if (afterTaskId) {
        const foundIndex = targetCol.findIndex(t => String(t.id) === String(afterTaskId));
        if (foundIndex !== -1) insertIndex = foundIndex;
    }

    targetCol.splice(insertIndex, 0, task);

    // 3. Assign
    boardData.columns[sourceColId] = sourceCol;
    if (sourceColId !== targetColId) {
        boardData.columns[targetColId] = targetCol;
    }

    persist();
}
