goog.provide('kassy.config');

kassy.config = {
    daysLimit: 7,

    showTypeIcons: {
        "кш": '1', // концерты, шоу
        "сп": '2', // спорт
        "кн": '3', // кино
        "дт": '4', // детские
        "тр": '5', // театр
        "фс": '6', // фестивали
        "вс": '6', // выставки
        "см": '7'  // семинары
    },

    /**
     * @param {string} typeId
     * @return {string}
     */
    getShowIcon: function(typeId) {
        var icon = kassy.config.showTypeIcons[typeId];

        // Если нет иконки, пробуем взять по-умолчанию иконку "детские"
        if (!goog.isDef(icon)) {
            icon = kassy.config.showTypeIcons['дт'];

            // Если нет иконки по-умолчанию, тогда возвращаем пустую строку
            if (!goog.isNumber(icon)) { icon = ''; }
        }

        return icon;
    },

    buildingTypeIcons: {
        "4": '1', // концерты, шоу
        "7": '2', // спорт
        "8": '3', // кино
        "3": '4', // детские
        "2": '5', // театр
        "12": '6' // выставки
    },

    /**
     * @param {number} typeId
     * @return {string}
     */
    getBuildingIcon: function(typeId) {
        var icon = kassy.config.buildingTypeIcons[typeId];

        // Если нет иконки, пробуем взять по-умолчанию иконку "детские"
        if (!goog.isDef(icon)) {
            icon = kassy.config.buildingTypeIcons['3'];

            // Если нет иконки по-умолчанию, тогда возвращаем пустую строку
            if (!goog.isDef(icon)) { icon = ''; }
        }

        return icon;
    }
};