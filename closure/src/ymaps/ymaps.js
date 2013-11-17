goog.provide('kassy.ymaps.Map');

kassy.ymaps.ready = function(callback) {
    window['ymaps']['ready'](callback);
};

/**
 * @param {string} cityName
 * @param {function(Array.<number>)} callback
 */
kassy.ymaps.getCityCoords = function(cityName, callback) {
    var geocoder = window['ymaps']['geocode'](cityName);
    geocoder['then'](function (res) {
        var coords = res['geoObjects']['get'](0)['geometry']['getCoordinates']();
        callback(coords);
    });
};

/**
 * @param {Array.<string>} points
 * @param {function(*)} callback
 * @param {function(string)} errback
 */
kassy.ymaps.getRoute = function(points, callback, errback) {
    var route = window['ymaps']['route'](points, {
        'mapStateAutoApply': true // автоматически позиционировать карту
    });
    route['then'](
        function (route) {
            callback(route);
        },
        function (error) {
            errback(error.message);
        }
    );
};

/**
 * @param {Array.<number>} coordinates
 * @return {*}
 */
kassy.ymaps.buildGeoObjectPoint = function(coordinates, title, body, hint) {
    return new window['ymaps']['GeoObject']({
        'geometry': {
            'type': "Point",
            'coordinates': coordinates
        },
        // Описываем данные геообъекта.
        'properties': {
            'hintContent': hint,
            'balloonContentHeader': title,
            'balloonContentBody': body
        }
    }, {
        // Задаем пресет метки с точкой без содержимого.
        'preset': "twirl#redDotIcon",
        'draggable': false,
        // Переопределяем макет содержимого нижней части балуна.
        /*'balloonContentFooterLayout': window['ymaps']['templateLayoutFactory']['createClass'](
            'население: $[properties.population], координаты: $[geometry.coordinates]'
        ),*/
        // Отключаем задержку закрытия всплывающей подсказки.
        'hintHideTimeout': 0
    });
};

/**
 * Обертка для внешнего компонента iScroll. Если соответствующий компонент 
 * с требуемым интерфейсом будет неопределен, произойдет исключение.
 * @param {Element} element
 * @param {{center:Array.<number>, zoom:number}} options
 * @constructor
 */
kassy.ymaps.Map = function(element, options) {
    this.map_ = new window['ymaps']['Map'](element, options);
};

/**
 * @param {*} geoObject
 */
kassy.ymaps.Map.prototype.addGeoObject = function(geoObject) {
    this.map_['geoObjects']['add'](geoObject);
};

/**
 * @param {string} controlName
 */
kassy.ymaps.Map.prototype.addControl = function(controlName) {
    this.map_['controls']['add'](controlName);
};