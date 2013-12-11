goog.provide('kassy.ui.Scroll');
goog.provide('kassy.ui.ScrollOptions');


/** @typedef {{vScrollbar:(boolean|undefined), hScrollbar:(boolean|undefined)}} */
kassy.ui.ScrollOptions;


/**
 * Обертка для внешнего компонента iScroll. Если соответствующий компонент 
 * с требуемым интерфейсом будет неопределен, произойдет исключение.
 *
 * @param {Element} element - Элемент с фиксированной высотой, 
 внутри которого содержится эелемент, который необходимо скроллировать
 * @param {kassy.ui.ScrollOptions=} opt_options
 * @constructor
 */
kassy.ui.Scroll = function(element, opt_options) {
    // Экземпляр iScroll
    var scroll;
    this.scroll_ = scroll = new window['iScroll'](element, opt_options);

    // Создаем ссылки на методы экземпляра
    this.refresh_ = scroll['refresh'].bind(scroll);
    this.destroy_ = scroll['destroy'].bind(scroll);
};

/**
 * @return {number}
 */
kassy.ui.Scroll.prototype.getX = function() {
    return this.scroll_['x'];
};

/**
 * @return {number}
 */
kassy.ui.Scroll.prototype.getY = function() {
    return this.scroll_['y'];
};

/**
 * @return {boolean}
 */
kassy.ui.Scroll.prototype.isMoved = function() {
    return this.scroll_['moved'];
};

/**
 * iScroll::refresh()
 */
kassy.ui.Scroll.prototype.refresh = function() {
    this.refresh_();
};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} [time] in milliseconds
 * @param {boolean} [relative] at current position
 * @returns {*}
 */
kassy.ui.Scroll.prototype.scrollTo = function(x, y, time, relative) {
    return this.scroll_['scrollTo'](x, y, time, relative);
};

/**
 * Удаляет себя и связи, в том числе вызывает iScroll::destroy() для уничтожения внешнего объекта
 */
kassy.ui.Scroll.prototype.dispose = function() {
    this.destroy_();
};