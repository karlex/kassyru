goog.provide('kassy.utils');

kassy.utils.MONTH_NAMES = {
    GENETIVE: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
};

kassy.utils.WEEKDAY_NAMES = {
    NOMINATIVE: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
};

/**
 * @param {number} dateTime - in seconds
 * @return {string}
 */
kassy.utils.groupDateFormat = function(dateTime) {
    var date = new Date(dateTime * 1000);
    return goog.getMsg('{$day} {$month}, {$weekday}', {
        'day': date.getDate(),
        'month': kassy.utils.MONTH_NAMES.GENETIVE[date.getMonth()],
        'weekday': kassy.utils.WEEKDAY_NAMES.NOMINATIVE[date.getDay()]
    });
};

/**
 * @param {number} dateTime - in seconds
 * @return {string}
 */
kassy.utils.formatDDMMMM = function(dateTime) {
    var date = new Date(dateTime * 1000);
    return goog.getMsg('{$day} {$month}', {
        'day': date.getDate(),
        'month': kassy.utils.MONTH_NAMES.GENETIVE[date.getMonth()]
    });
};

/**
 * @param {function(?)} fn
 * @param {number} delay - In ms
 */
kassy.utils.debounce = function(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
};

/**
 * @param {string} text
 * @returns {string}
 */
kassy.utils.replaceUrlWithLinks = function(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp,'<a class="link" href="$1" target="_blank">$1</a>');
};

/**
 * @param {number} number - число
 * @param {string} decl1 - слово в первом склонении
 * @param {string} decl2 - слово во втором склонении
 * @param {string} decl3 - слово в третьем склонении
 * @return {string}
 */
kassy.utils.declOfNum = function(number, decl1, decl2, decl3) {
    var cases = [2, 0, 1, 1, 1, 2],
        titles = [decl1, decl2, decl3],
        declIndex = (number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5];

    return titles[declIndex];
};

/**
 * @param {{ id:number, date:number, ticker:string, title:string, message:string }} options
 */
kassy.utils.addLocalNotification = function(options) {
    var userAgent = window['navigator']['userAgent'];

    if (userAgent.match(/(Android)/)) {
        window['plugins']['localNotification']['add']({
            'id' : options.id,
            'date' : new Date(options.date),
            'message' : options.title + "\r\n" + options.message,
            'ticker' : options.ticker,
            'repeatDaily' : false
        });
    }
    else if (userAgent.match(/(iPhone|iPod|iPad)/)) {
        window['plugins']['localNotification']['add']({
            'id' : options.id,
            'date' : new Date(options.date),
            'message' : options.title + "\r\n" + options.message
        });
    }
};