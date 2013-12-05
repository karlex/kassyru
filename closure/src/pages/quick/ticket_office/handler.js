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

        this.setContentTitle('Учреждения');

        // кассы
        this.getBuildingList_({ kind: 0 });
    };

    TicketOffice.prototype.getBuildingList_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotBuildingList_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetBuildingList(options));
    };

    /**
     * @param {kassy.rpc.BuildingListType} buildingList
     */
    TicketOffice.prototype.gotBuildingList_ = function(buildingList) {
        var buildings = [];

        if (buildingList) {
            buildings = buildingList.buildings;

            goog.array.forEach(buildings, function(building) {
                building.name = building.name.replace('Касса: ', '');
            });
        }

        this.show_(buildings);
    };

    /**
     * @param {Array.<kassy.data.BuildingModel>} buildings
     * @private
     */
    TicketOffice.prototype.show_ = function(buildings) {
        this.setContentText(kassy.views.ticketoffice.List({
            buildings: buildings
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