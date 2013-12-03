/**
 * @fileoverview
 */

goog.provide('kassy.handlers.PlaceTypes');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.rpc.GetBuildingTypes');
goog.require('kassy.views.place');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.PlaceTypes = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.PlaceTypes, kassy.handlers.BaseHandler);
    var PlaceTypes = kassy.handlers.PlaceTypes;

    /**
     * @override
     */
    PlaceTypes.prototype.handle_ = function(path) {
        this.setContentTitle('');

        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);

        var barrier = this.barrier_ = new goog.async.Deferred();

        this.executeRPC(
            new kassy.rpc.GetBuildingTypes({ response: barrier.callback.bind(barrier) })
        );

        barrier.addCallback(function(buildingTypeInfo) {
            this.subdivision_ = buildingTypeInfo.subdivision;
            this.types_ = buildingTypeInfo.buildingTypes;
            this.show_(this.types_);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.BuildingTypeModel>} buildingTypes
     */
    PlaceTypes.prototype.show_ = function(buildingTypes) {
        goog.array.sort(buildingTypes, function(a, b) {
            var diff = a.order - b.order;
            return (diff !== 0 ? diff : a.other - b.other);
        });

        var filteredTypes = goog.array.filter(buildingTypes, function(type) {
            return (type.kind === 1 && type.state === 1);
        });

        this.searchField_.setContentText(kassy.views.place.Types({
            types: filteredTypes,
            subdivision: this.subdivision_
        }));
        this.setScroll();
        this.setLoadingVisible(false);
    };

    PlaceTypes.prototype.onSearch_ = function(e) {
        var types = this.types_;

        if (!types) return;

        if (e.search && e.search.length > 0) {

            var filterFn = goog.partial(function(search, type) {
                return goog.string.startsWith(type.name.toLowerCase(), search);
            }, e.search.toLowerCase());

            this.show_(goog.array.filter(types, filterFn));
        } else {
            this.show_(types);
        }
    };

    /** @override */
    PlaceTypes.prototype.disposeInternal = function() {
        PlaceTypes.superClass_.disposeInternal.call(this);

        if (this.searchField_) {
            this.searchField_.dispose();
        }

        this.searchField_ = null;
    };
});