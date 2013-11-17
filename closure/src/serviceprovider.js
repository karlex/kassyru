/**
 * @fileoverview
 *
 * A Service Provider for the Relieved Blog.
 */

goog.provide('kassy.ServiceProvider');

goog.require('relief.handlers.CommonServiceProvider');

/**
 * A Service Provider implementation that extends CommonServiceProvider to also
 * include an event bus.
 *
 * @param {goog.events.EventTarget} eventBus The app's event bus.
 * @param {!relief.nav.URLMap} urlMap The mapping from URL hash codes to Handler
 *    constructors.
 * @param {!relief.cache.Cache} cache The app's cache.
 * @param {!relief.rpc.RPCService} rpc The app's RPC Service.
 * @param {!relief.auth.AuthManager} auth The app's auth manager instance.
 * @param {!HTMLIFrameElement} iframe The iframe to be used by the goog.History
 *    object.
 * @param {!HTMLInputElement} input The hidden input field to be used by the
 *    goog.History object.
 * @param {!Element} content The root element into which handlers should inject
 *    content.
 * @param {kassy.data.DataManager} data
 *
 * @constructor
 * @extends {relief.handlers.CommonServiceProvider}
 */
kassy.ServiceProvider = function(eventBus, urlMap, cache, rpc, auth, iframe, input, content, data) {
    goog.base(this, urlMap, cache, rpc, auth, iframe, input, content);

    /**
    * @type {goog.events.EventTarget}
    * @private
    */
    this.eventBus_ = eventBus;

    this.data_ = data;
};
goog.inherits(kassy.ServiceProvider, relief.handlers.CommonServiceProvider);

/**
 * @param {boolean=} opt_withScroll default is true
 * @override
 */
kassy.ServiceProvider.prototype.getContentRoot = function(opt_withScroll) {
    var content = kassy.ServiceProvider.superClass_.getContentRoot.call(this);
    /*var withScroll = goog.isBoolean(opt_withScroll) ? opt_withScroll : true;
    if (withScroll) {
        var contentHolder = goog.dom.getParentElement(content);
        new kassy.ui.Scroll(contentHolder);
    }*/
    return content;
};

/**
 * @param {string} title
 */
kassy.ServiceProvider.prototype.setContentTitle = function(title) {
    goog.dom.setTextContent(goog.dom.getElement('content-title'), title);
    goog.dom.getElement('title-logo').style.display = (title.length > 0 ? 'none' : 'block');
};

/**
 * @return {goog.events.EventTarget} The app's event bus.
 */
kassy.ServiceProvider.prototype.getEventBus = function() {
  return this.eventBus_;
};

/**
 * @return {kassy.data.DataManager}
 */
kassy.ServiceProvider.prototype.getDataManager = function() {
    return this.data_;
};

/**
 * @inheritDoc
 */
kassy.ServiceProvider.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');

  this.eventBus_.dispose();
  this.eventBus_ = this.data_ = null;
};