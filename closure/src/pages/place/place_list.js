/**
 * @fileoverview
 */

goog.provide('kassy.handlers.PlaceList');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.ui.SearchField');
goog.require('kassy.views.place');
goog.require('kassy.rpc.GetBuildingList');

goog.require('goog.date.Date');
goog.require('goog.date.Interval');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.PlaceList = function(sp) {
        goog.base(this, sp);

        /**
         * @type {Array.<kassy.data.BuildingModel>}
         * @private
         */
        this.buildings_ = null;

        /**
         * @type {boolean}
         * @private
         */
        this.useBuildingTypeTitle_ = false;
    };
    goog.inherits(kassy.handlers.PlaceList, kassy.handlers.BaseHandler);
    var PlaceList = kassy.handlers.PlaceList;

    /** @override */
    PlaceList.prototype.handle_ = function(path) {
        var buildingTypeId = parseInt(path.params, 10);

        this.useBuildingTypeTitle_ = true;

        this.setContentTitle('Учреждения');

        this.initSearch_();

        this.getBuildingList_({ typeId: buildingTypeId });
    };

    PlaceList.prototype.initSearch_ = function() {
        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);
    };

    PlaceList.prototype.getBuildingList_ = function(options) {
        var barrier = this.barrier_ = new goog.async.Deferred();
        barrier.addCallback(this.gotBuildingList_, this);

        options.response = barrier.callback.bind(barrier);

        this.executeRPC(new kassy.rpc.GetBuildingList(options));
    };

    /**
     * @param {kassy.rpc.BuildingListType} buildingList
     */
    PlaceList.prototype.gotBuildingList_ = function(buildingList) {
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

        // запомним для поиска
        this.buildings_ = buildings;

        this.show_(buildings);
    };

    /**
     * @param {Array.<kassy.data.BuildingModel>} buildings
     */
    PlaceList.prototype.show_ = function(buildings) {
        this.searchField_.setContentText(kassy.views.place.List({
            places: buildings
        }));
        this.setScroll();
        this.setLoadingVisible(false);
    };

    PlaceList.prototype.onSearch_ = function(e) {
        if (!this.buildings_) return;

        if (e.search && e.search.length > 0) {

            var filterFn = goog.partial(function(search, place) {
                return goog.string.startsWith(place.name.toLowerCase(), search);
            }, e.search.toLowerCase());

            this.show_(goog.array.filter(this.buildings_, filterFn));
        } else {
            this.show_(this.buildings_);
        }
    };

    /** @override */
    PlaceList.prototype.disposeInternal = function() {
        if (this.barrier_) {
            this.barrier_.cancel(true);
        }

        if (this.searchField_) {
            this.searchField_.dispose();
        }

        this.barrier_ = this.searchField_ = this.places_ = null;
    };
});