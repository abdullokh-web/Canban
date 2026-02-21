/**
 * i18n.js
 * Handles internationalization (i18n) for the Kanban Board.
 * Supports English (en), Russian (ru), and Uzbek (uz).
 */

const translations = {
    en: {
        app_title: "Local Kanban",
        add_task: "+ Add Task",
        todo: "To Do",
        doing: "In Progress",
        done: "Done",
        task_title_placeholder: "Task Title",
        task_desc_placeholder: "Task Description (optional)",
        priority_low: "Low Priority",
        priority_medium: "Medium Priority",
        priority_high: "High Priority",
        save: "Save",
        cancel: "Cancel",
        theme_light: "Light Mode",
        theme_dark: "Dark Mode",
        language: "Language",
        empty_column: "Drop tasks here",
        delete_task: "Delete",
        edit_task: "Edit",
        creator: "Creator",
        search_placeholder: "Search tasks...",
        clear_done: "Clear Done Tasks",
        confirm_clear_done: "Are you sure you want to permanently delete all completed tasks?"
    },
    ru: {
        app_title: "Локальный Канбан",
        add_task: "+ Добавить задачу",
        todo: "Нужно сделать",
        doing: "В процессе",
        done: "Готово",
        task_title_placeholder: "Название задачи",
        task_desc_placeholder: "Описание задачи (необязательно)",
        priority_low: "Низкий приоритет",
        priority_medium: "Средний приоритет",
        priority_high: "Высокий приоритет",
        save: "Сохранить",
        cancel: "Отмена",
        theme_light: "Светлая тема",
        theme_dark: "Темная тема",
        language: "Язык",
        empty_column: "Перетащите задачи сюда",
        delete_task: "Удалить",
        edit_task: "Редактировать",
        creator: "Создатель",
        search_placeholder: "Поиск задач...",
        clear_done: "Очистить готовые",
        confirm_clear_done: "Вы уверены, что хотите безвозвратно удалить все выполненные задачи?"
    },
    uz: {
        app_title: "Lokal Kanban",
        add_task: "+ Vazifa qo'shish",
        todo: "Bajarilishi kerak",
        doing: "Jarayonda",
        done: "Bajarildi",
        task_title_placeholder: "Vazifa nomi",
        task_desc_placeholder: "Vazifa tavsifi (ixtiyoriy)",
        priority_low: "Past ustuvorlik",
        priority_medium: "O'rta ustuvorlik",
        priority_high: "Yuqori ustuvorlik",
        save: "Saqlash",
        cancel: "Bekor qilish",
        theme_light: "Yorug' mavzu",
        theme_dark: "Qorong'i mavzu",
        language: "Til",
        empty_column: "Vazifalarni shu yerga tashlang",
        delete_task: "O'chirish",
        edit_task: "Tahrirlash",
        creator: "Yaratuvchi",
        search_placeholder: "Vazifalarni izlash...",
        clear_done: "Bajarilganlarni tozalash",
        confirm_clear_done: "Barcha bajarilgan vazifalarni butunlay o'chirib tashlamoqchimisiz?"
    }
};

/**
 * Gets a translated string based on language and key.
 * @param {string} lang - The language code ('en', 'ru', 'uz').
 * @param {string} key - The translation key.
 * @returns {string} The translated string or the key if not found.
 */
function t(lang, key) {
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    // Fallback to English if translation is missing, otherwise return the key
    if (translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
}

/**
 * Returns the full translations object.
 * @returns {Object} The translations object.
 */
function getTranslations() {
    return translations;
}
