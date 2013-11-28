/**
 * @fileoverview
 */

goog.provide('kassy.handlers.MovieRecommend');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.ui.SearchField');
goog.require('kassy.views.movie');
goog.require('kassy.utils');

goog.require('goog.string');
goog.require('goog.date.Date');
goog.require('goog.date.Interval');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.MovieList}
     */
    kassy.handlers.MovieRecommend = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.MovieRecommend, kassy.handlers.MovieList);
    var MovieRecommend = kassy.handlers.MovieRecommend;

    /** @override */
    MovieRecommend.prototype.handle_ = function(path) {
        this.setContentTitle('Рекомендуем');

        this.initSearch_();

        this.getEventList_({ isRecommend: true });
    };
});