goog.provide('kassy.handlers.TicketOffice');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.ticketoffice');
goog.require('kassy.ymaps.Map');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.TicketOffice = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.TicketOffice, kassy.handlers.BaseHandler);
    var TicketOffice = kassy.handlers.TicketOffice;

    /** @override */
    TicketOffice.prototype.handle_ = function(path) {
        this.setContentTitle('Кассы');

        this.loadAndShow_();
    };

    TicketOffice.prototype.loadAndShow_ = function() {
        var Def = goog.async.Deferred;
        var defs = [new Def()];

        this.data_.findBuildingTypes(function(buildingTypes) { defs[0].callback(buildingTypes); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var buildingTypes = results[0][1];
            var ticketBuildingTypes = goog.array.filter(buildingTypes, function(buildingType) {
                return buildingType.kind == 0;
            });
            this.loadBuildingsByTypeIds_(ticketBuildingTypes, this.show_.bind(this));
        }, this);
    };

    /**
     * @param {Array.<kassy.data.BuildingTypeModel>} types
     * @param {function(Array.<kassy.data.BuildingModel>)} callback
     * @private
     */
    TicketOffice.prototype.loadBuildingsByTypeIds_ = function(types, callback) {
        var defs = goog.array.map(types, function(type) {
            var def = new goog.async.Deferred();
            this.data_.findBuilding(type.id, function(buildings) {
                def.callback(buildings);
            });
            return def;
        }.bind(this));

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var buildingLists = goog.array.map(results, function(result) {
                return result[1]; // building list
            });
            var buildings = goog.array.concat.apply(null, buildingLists);
            callback(buildings);
        })
    };

    /**
     * @param {Array.<kassy.data.BuildingModel>} buildings
     * @private
     */
    TicketOffice.prototype.show_ = function(buildings) {
        this.setContentText(kassy.views.ticketoffice.List({
            buildings: goog.array.map(buildings, function(building) {
                var bld = goog.object.clone(building);
                bld.name = bld.name.replace('Касса: ', '');
                return bld;
            })
        }));
        this.setScroll();

        kassy.ymaps.ready(function() {

            var showMapWithoutGps = function() {
                var geolocation = window['ymaps']['geolocation'];
                this.showDist_(buildings, [geolocation['latitude'], geolocation['longitude']])
            }.bind(this);

            if (kassy.settings.getUseGPS()) {
                navigator['geolocation']['getCurrentPosition'](
                    function(position) {
                        this.showDist_(buildings, [position['coords']['latitude'], position['coords']['longitude']])
                    }.bind(this),

                    showMapWithoutGps,

                    { 'maximumAge': 3000, 'timeout': 10000, 'enableHighAccuracy': true }
                );
            }
            else {
                showMapWithoutGps();
            }

        }.bind(this));
    };

    TicketOffice.prototype.showDist_ = function(buildings, selfPosition) {
        goog.array.forEach(buildings, function(building) {
            var points = [selfPosition, [building._lat, building._lng]];

            kassy.ymaps.getRoute(points, function(route) {
                var bldDistEl = goog.dom.getElement('bld-dist-' + building.id);
                if (bldDistEl) {
                    goog.dom.setTextContent(bldDistEl, Math.round(route.getLength() / 1000) + ' км');
                }
            }, function() {});
        });
    };
});