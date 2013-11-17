goog.provide('kassy.ui.alert');

/**
 * @param {string} text
 * @param {string} title
 * @param {string} buttons
 * @param {function(number)=} callback
 */
kassy.ui.alert = function(text, title, buttons, callback) {
    window['navigator']['notification']['alert'](text, callback, title, buttons);
};