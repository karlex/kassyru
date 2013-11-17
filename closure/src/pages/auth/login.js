goog.provide('kassy.handlers.Login');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.auth');
goog.require('kassy.data.Login');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.Login = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.Login, kassy.handlers.BaseHandler);
    var Login = kassy.handlers.Login;

    /** @override */
    Login.prototype.handle_ = function(path) {
        this.setContentTitle('Авторизация');
        this.setContentText(kassy.views.auth.Login());

        /*var tabedEls = goog.array.toArray(goog.dom.query("[tabindex]"));

        goog.array.sort(tabedEls, function(a, b) {
            return ~~a.getAttribute('tabindex') - ~~b.getAttribute('tabindex');
        });

        this.handler.listen(this.getContentElement(), [goog.events.EventType.FOCUS, goog.events.EventType.FOCUSIN], function(e) {
            if (e.target.tagName.toLowerCase() == 'input') {
                window.console.log('FOCUSIN');
                window['plugins']['SoftKeyBoard']['show'](function() {
                    window.console.log('SHOW KEYBOARD WIN');
                }, function() {
                    window.console.log('SHOW KEYBOARD FAIL');
                });
            }
        });

        tabedEls[0].focus();

        this.handler.listen(this.getContentElement(), goog.events.EventType.KEYPRESS, function(e) {
            if (e.keyCode == 13 && e.target.tagName.toLowerCase() == 'input') {

                var currTabIndex = ~~e.target.getAttribute('tabindex');

                var nextTabEl = goog.array.find(tabedEls, function(tabedEl) {
                    return (~~tabedEl.getAttribute('tabindex')) > currTabIndex;
                });

                if (nextTabEl) {
                    nextTabEl.focus();
                    return false;
                }
            }
        });*/

        this.handler.listen(this.getContentElement(), goog.events.EventType.CLICK, function(e) {
            var el = e.target;
            if (goog.dom.classes.has(el, 'login-btn')) {
                var emailEl = goog.dom.getElement('email');
                var passwordEl = goog.dom.getElement('password');
                kassy.data.execute(new kassy.data.Login(
                    emailEl.value,
                    passwordEl.value
                ));
            }
        }, false, this);
    };
});