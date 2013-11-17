goog.provide('kassy.handlers.SettingsRegion');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.settings');
goog.require('goog.dom.xml');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.SettingsRegion = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.SettingsRegion, kassy.handlers.BaseHandler);
    var SettingsRegion = kassy.handlers.SettingsRegion;

    /** @override */
    SettingsRegion.prototype.handle_ = function(path) {
        this.setContentTitle('Выбор региона');

        this.loadAndShow_();
    };

    SettingsRegion.prototype.loadAndShow_ = function() {
        this.barrier_ = new goog.async.Deferred();
        this.barrier_.addCallback(this.show_, this);

        this.data_.findSubdivisions(function(subdivisions) {
            this.barrier_.callback(subdivisions);
        }.bind(this));
    };

    /**
     * @param {Array.<kassy.data.SubdivisionModel>} subdivisions
     * @private
     */
    SettingsRegion.prototype.show_ = function(subdivisions) {
        this.setContentText(kassy.views.settings.Region({ regions: subdivisions }));
        this.setScroll();

        this.handler.listen(this.getContentElement(), goog.events.EventType.CLICK, function(e) {
            if (goog.dom.classes.has(e.target, 'item-region')) {
                var regionId = e.target.getAttribute('data-region-id');
                kassy.settings.setRegionId(regionId);

                window.history.go(-1);

                return false;
            }
        });
    };
});