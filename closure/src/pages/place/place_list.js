/**
 * @fileoverview
 */

goog.provide('kassy.handlers.PlaceList');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.ui.SearchField');
goog.require('kassy.views.place');

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
         * @type {goog.async.Deferred}
         * @private
         */
        this.barrier_ = null

        /**
         * @type {Array.<kassy.data.BuildingModel>}
         * @private
         */
        this.places_ = null;
    };
    goog.inherits(kassy.handlers.PlaceList, kassy.handlers.BaseHandler);
    var PlaceList = kassy.handlers.PlaceList;

    /** @override */
    PlaceList.prototype.handle_ = function(path) {
        this.setContentTitle('Учреждения');

        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);

        var buildingTypeId = parseInt(path.params, 10);
        var showTypeId = kassy.settings.getShowTypeIdByBuildingTypeId(buildingTypeId);

        this.loadAndShow_(buildingTypeId, showTypeId);
    };

    /**
     * @param {number} buildingTypeId
     * @param {string?} showTypeId
     */
    PlaceList.prototype.loadAndShow_ = function(buildingTypeId, showTypeId) {
        var Def = goog.async.Deferred;
        var defs = [new Def(), new Def(), new Def()];

        var data = this.data_;
        data.findBuilding(buildingTypeId, function(buildings, buildingIndex) { defs[0].callback(buildings); });
        data.findShowType(function(showTypes, showTypeIndex) { defs[1].callback(showTypeIndex); });
        data.findBuildingTypes(function(buildingTypes, buildingTypeIndex) { defs[2].callback(buildingTypeIndex); });

        this.barrier_ = new goog.async.DeferredList(defs);
        this.barrier_.addCallback(function(results) {
            var buildings = results[0][1];
            var showTypeIndex = results[1][1];
            var buildingTypeIndex = results[2][1];

            this.showType_ = showTypeIndex[showTypeId];
            this.buildingType_ = buildingTypeIndex[buildingTypeId];

            if (this.buildingType_ instanceof kassy.data.BuildingTypeModel) {
                this.setContentTitle(this.buildingType_.name);
            }

            this.places_ = buildings;
            this.show_(buildings);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.BuildingModel>} buildings
     */
    PlaceList.prototype.show_ = function(buildings) {
        this.searchField_.setContentText(kassy.views.place.List({
            places: buildings,
            buildingType: this.buildingType_,
            showType: this.showType_
        }));
        this.setScroll();
        this.setLoadingVisible(false);
    };

    PlaceList.prototype.onSearch_ = function(e) {
        if (!this.places_) return;

        if (e.search && e.search.length > 0) {

            var filterFn = goog.partial(function(search, place) {
                return goog.string.startsWith(place.name.toLowerCase(), search);
            }, e.search.toLowerCase());

            this.show_(goog.array.filter(this.places_, filterFn));
        } else {
            this.show_(this.places_);
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