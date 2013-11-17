goog.provide('kassy.App');

goog.require('kassy.config');

goog.require('goog.events.EventTarget');
goog.require('goog.structs.Map');

goog.require('kassy.settings');
goog.require('kassy.ServiceProvider');
goog.require('kassy.auth.AuthManager');
goog.require('kassy.urlMap');
//goog.require('rb.menu.Menu');
goog.require('kassy.ui.Scroll');
goog.require('kassy.data.DataManager');
goog.require('kassy.ui.alert');
goog.require('kassy.ui.downloadFile');

goog.require('relief.cache.Cache');
goog.require('relief.nav.NavManager');
goog.require('relief.rpc.RPCService');

/**
 * @constructor
 */
kassy.App = function () {
    (function initFooterLinks () {
        var footerEl = goog.dom.getElementByClass('footer-container');
        var footerLinkEls = goog.dom.getElementsByClass('link', footerEl);
        var activeLinkEl = null;
        goog.array.forEach(footerLinkEls, function(linkEl) {
            if (goog.dom.classes.has(linkEl, 'active')) {
                activeLinkEl = linkEl;
            }
            goog.events.listen(linkEl, [goog.events.EventType.TOUCHSTART, goog.events.EventType.MOUSEDOWN], function(e) {
                goog.dom.classes.enable(activeLinkEl, 'active', false);
                goog.dom.classes.enable(linkEl, 'active', true);
                activeLinkEl = linkEl;
            });
        });
    })();

    goog.events.listen(document.body, [goog.events.EventType.TOUCHSTART, goog.events.EventType.MOUSEDOWN], function(e) {
        var el = goog.dom.getAncestorByTagNameAndClass(e.target, 'div', 'link');
        if (el && !goog.dom.classes.has(el, 'hl_off')) {
            goog.dom.classes.enable(el, 'highlight', true);
            goog.events.listenOnce(el, [goog.events.EventType.TOUCHEND, goog.events.EventType.MOUSEOUT], function() {
                goog.dom.classes.enable(this, 'highlight', false);
            })
        }
    });

    goog.events.listen(document.body, goog.events.EventType.CLICK, function(e) {
        var el = e.target;

        // el не ссылка, тогда ищем ссылку-родителя
        if (!goog.dom.classes.has(el, 'link')) {
            el = goog.dom.getAncestorByTagNameAndClass(el, null, 'link');
        }

        // Здесь гарантированно будет ссылка или null
        if (el) {
            var href = el.getAttribute('href');

            if (href) {
                if (/^tel:/.test(href)) {
                    window.location = href;
                } else {
                    switch (el.getAttribute('target')) {
                        case '_blank':
                            e.preventDefault();
                            window.navigator['app']['loadUrl'](href, {'openExternal': true});
                            return false;
                        break;

                        default:
                            window.location.href = href;
                    }
                }
            }
        }
    });

    var eventBus = new goog.events.EventTarget();

    var cache;
    /**
    * @type {relief.cache.Cache}
    * @private
    */
    this.cache_ = cache = new relief.cache.Cache();

    var headers = new goog.structs.Map({
        'Content-Type': 'application/x-www-form-urlencoded'
    });

    var rpc;
    /**
    * @type {relief.rpc.RPCService}
    * @private
    */
    this.rpc_ = rpc = new relief.rpc.RPCService(cache, headers);

    var auth;
    /**
    * @type {kassy.auth.AuthManager}
    * @private
    */
    this.auth_ = auth = new kassy.auth.AuthManager(rpc);
    auth.setParentEventTarget(eventBus);

    var data = new kassy.data.DataManager();

    var iframe = /** @type {!HTMLIFrameElement} */ (goog.dom.getElement('history_frame')),
        input = /** @type {!HTMLInputElement} */ (goog.dom.getElement('history_input')),
        content = /** @type {!Element} */ (goog.dom.getElement('content'));

    var sp = new kassy.ServiceProvider(eventBus, kassy.urlMap, cache, rpc, auth, iframe, input, content, data);

    var nav;
    /**
    * @type {relief.nav.NavManager}
    * @private
    */
    this.nav_ = nav = new relief.nav.NavManager(sp);
    nav.setParentEventTarget(eventBus);

    window.location.hash = 'movie/types';

    var hideTimer = null;
    var hideListener = null;
    var hideSplashScreen = function() {
        if (hideTimer !== null) { window.clearTimeout(hideTimer); }
        if (hideListener !== null) { goog.events.unlistenByKey(hideListener); }
        window['navigator']['splashscreen']['hide']();
    };
    hideTimer = window.setTimeout(hideSplashScreen, 10000);
    hideListener = goog.events.listenOnce(eventBus, 'set_content_text', hideSplashScreen);
};

kassy.run = function() {
    new kassy.App();
};
goog.exportSymbol('kassy.run', kassy.run);