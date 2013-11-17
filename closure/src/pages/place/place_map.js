/**
 * @fileoverview
 *
 * A handler class for the home page.
 */

goog.provide('kassy.handlers.PlaceMap');

goog.require('kassy.ymaps.Map');

goog.require('relief.nav.Handler');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.PlaceMap = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.PlaceMap, kassy.handlers.BaseHandler);
    var PlaceMap = kassy.handlers.PlaceMap;

    /** @override */
    PlaceMap.prototype.handle_ = function(path) {
        this.setContentTitle('Карта');

        var params = path.params.split('/'),
            buildingIds = params;

        this.loadAndShow_(buildingIds);
    };

    /**
     * @param {Array.<number>} buildingIds
     */
    PlaceMap.prototype.loadAndShow_ = function(buildingIds) {
        var defs = goog.array.map(buildingIds, function(buildingId) {
            var def = new goog.async.Deferred();
            this.data_.findBuildingById(~~buildingId, def.callback.bind(def));

            return def;
        }, this);

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            // Одномерный список объектов
            var buildings = goog.array.reduce(results, function(modelsAccum, result) {
                var models = result[1];

                return goog.array.reduce(models, function(modelsAccum, model) {
                    modelsAccum.push(model);
                    return modelsAccum;
                }, modelsAccum);

            }, []);

            this.show_(buildings);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.BuildingModel>} buildings
     * @private
     */
    PlaceMap.prototype.show_ = function(buildings) {
        window.console.log('BUILDING COUNT: ' + buildings.length);

        kassy.ymaps.ready(function() {

            if (buildings.length > 1) {
                var showMapWithoutGps = function() {
                    var geolocation = window['ymaps']['geolocation'];
                    this.showMap_(buildings, [geolocation['latitude'], geolocation['longitude']])
                }.bind(this);

                if (kassy.settings.getUseGPS()) {
                    navigator['geolocation']['getCurrentPosition'](
                        function(position) {
                            this.showMap_(buildings, [position['coords']['latitude'], position['coords']['longitude']])
                        }.bind(this),

                        showMapWithoutGps,

                        { 'maximumAge': 3000, 'timeout': 60000, 'enableHighAccuracy': true }
                    );
                }
                else {
                    showMapWithoutGps();
                }
            }
            else {
                var coords = [buildings[0]._lat, buildings[0]._lng];
                this.showMap_(buildings, coords);
            }

        }.bind(this));
    };

    PlaceMap.prototype.showMap_ = function(buildings, selfPosition) {
        var contentEl = this.getContentElement();
        contentEl.style.height = '100%';

        var geolocation = window['ymaps']['geolocation'];

        var myMap = new kassy.ymaps.Map(contentEl, {
            'center': selfPosition,
            'zoom': (buildings.length > 1 ? 12 : 16)
        });
        myMap.addControl('smallZoomControl');
        myMap.addGeoObject(
            new window['ymaps']['Placemark'](selfPosition, {
                'balloonContentHeader': geolocation['country'],
                'balloonContent': geolocation['city'],
                'balloonContentFooter': geolocation['region']
            })
        );

        goog.array.forEach(buildings, function(building) {
            window.console.log('BUILDING COORDS: ' + building._lat + ' '+ building._lng);
            var coords = [building._lat, building._lng];
            var body = building.address + (building.phones.length > 0 ? '<br>' + building.phones[0] : '');
            var geoPoint = kassy.ymaps.buildGeoObjectPoint(coords, building.name, body, building.name);
            myMap.addGeoObject(geoPoint);
        });

        this.setLoadingVisible(false);
    };
});