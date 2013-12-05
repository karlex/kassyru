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

        var options = {};

        // кассы
        if (path.params == 'ticket_office') {
            options.kind = 0;
        }
        // ID учреждения
        else {
            options.id = ~~path.params;
        }

        this.getBuildingList_(options);
    };

    PlaceMap.prototype.getBuildingList_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotBuildingList_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetBuildingList(options));
    };

    /**
     * @param {kassy.rpc.BuildingListType} buildingList
     */
    PlaceMap.prototype.gotBuildingList_ = function(buildingList) {
        var buildings = [];

        if (buildingList) {
            buildings = buildingList.buildings;

            if (this.useBuildingTypeTitle_) {
                var buildingType = buildingList.buildingTypes[0];
                if (buildingType) {
                    this.setContentTitle(buildingType.name);
                }
            }
        }

        this.show_(buildings);
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
            var coords = [building._lat, building._lng];
            var body = building.address + (building.phones.length > 0 ? '<br>' + building.phones[0] : '');
            var geoPoint = kassy.ymaps.buildGeoObjectPoint(coords, building.name, body, building.name);
            myMap.addGeoObject(geoPoint);
        });

        this.setLoadingVisible(false);
    };
});