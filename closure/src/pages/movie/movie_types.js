/**
 * @fileoverview
 */

goog.provide('kassy.handlers.MovieTypes');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.movie');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.MovieTypes = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.MovieTypes, kassy.handlers.BaseHandler);
    var MovieTypes = kassy.handlers.MovieTypes;

    /** @override */
    MovieTypes.prototype.handle_ = function(path) {
        this.setContentTitle('');

        this.searchField_ = new kassy.ui.SearchField(this.getContentElement());
        this.handler.listen(this.searchField_, goog.events.EventType.CHANGE, this.onSearch_, false, this);

        var defs = [new goog.async.Deferred(), new goog.async.Deferred()];
        var barrier = this.barrier_ = new goog.async.DeferredList(defs);

        var data = this.data_;
        data.findSubdivision(kassy.settings.getRegionId(), function(subdivisions) { defs[0].callback(subdivisions[0]); });
        data.findShowType(function(types) { defs[1].callback(types); });

        barrier.addCallback(function(results) {
            this.subdivision_ = results[0][1];
            this.types_ = results[1][1];
            this.show_(this.types_);
        }, this);
    };

    /**
     * @param {Array.<kassy.data.ShowTypeModel>} types
     */
    MovieTypes.prototype.show_ = function(types) {
        goog.array.sort(types, function(a, b) {
            var diff = a.order - b.order;
            return (diff !== 0 ? diff : a.other - b.other);
        });

        var view = kassy.views.movie.Types({
            types: types,
            subdivision: this.subdivision_
        });
        this.searchField_.setContentText(view);
        this.setScroll();
        this.setLoadingVisible(false);
    };

    MovieTypes.prototype.onSearch_ = function(e) {
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
    MovieTypes.prototype.disposeInternal = function() {
        MovieTypes.superClass_.disposeInternal.call(this);

        if (this.searchField_) {
            this.searchField_.dispose();
        }

        this.searchField_ = null;
    };
});