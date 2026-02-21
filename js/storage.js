/**
 * storage.js
 * Handles optimized JSON CRUD operations utilizing LocalStorage.
 * Includes debouncing for write performance and data validation.
 */

const STORAGE_KEY = 'kanban_data';

// Pure fallback schema
const defaultData = {
    settings: {
        theme: "light",
        lang: "en"
    },
    columns: {
        todo: [],
        doing: [],
        done: []
    }
};

/**
 * Validates the loaded structure. Returns true if valid, false otherwise.
 * @param {any} data - Data to validate.
 * @returns {boolean}
 */
function isValidSchema(data) {
    if (!data || typeof data !== 'object') return false;
    if (!data.settings || typeof data.settings.theme !== 'string' || typeof data.settings.lang !== 'string') return false;
    if (!data.columns || !Array.isArray(data.columns.todo) || !Array.isArray(data.columns.doing) || !Array.isArray(data.columns.done)) return false;
    return true;
}

/**
 * Loads the board data from local storage with validation.
 * @returns {Object} The guaranteed valid board data object.
 */
function loadData() {
    try {
        const rawData = localStorage.getItem(STORAGE_KEY);
        if (!rawData) {
            return generateInitialData();
        }

        const parsedData = JSON.parse(rawData);

        if (isValidSchema(parsedData)) {
            return parsedData;
        } else {
            console.warn("Invalid data schema detected. Reverting to default.");
            return generateInitialData();
        }
    } catch (error) {
        console.error("Error loading data from LocalStorage:", error);
        return generateInitialData();
    }
}

/**
 * Generates initial data applying system theme preference.
 * @returns {Object}
 */
function generateInitialData() {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialData = JSON.parse(JSON.stringify(defaultData));
    if (prefersDark) {
        initialData.settings.theme = "dark";
    }
    return initialData;
}

/**
 * Debounce helper for optimization
 */
let saveTimeout;
const SAVE_DELAY_MS = 300; // Debounce delay

/**
 * Saves the given data object to local storage with debouncing optimization.
 * Prevents UI thread blocking during rapid state mutations.
 * @param {Object} data - The board data to save.
 */
function saveData(data) {
    clearTimeout(saveTimeout);

    saveTimeout = setTimeout(() => {
        try {
            // Stringify can be sync-heavy, bounding it in setTimeout improves perceived performance
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Critical Error saving data to LocalStorage:", error);
        }
    }, SAVE_DELAY_MS);
}
