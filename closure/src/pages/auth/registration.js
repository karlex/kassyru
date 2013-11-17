goog.provide('kassy.handlers.Registration');

goog.require('kassy.handlers.BaseHandler');
goog.require('kassy.views.auth');
goog.require('kassy.data.Registration');

goog.scope(function() {
    /**
     * @param {kassy.ServiceProvider} sp The ServiceProvider.
     * @constructor
     * @extends {kassy.handlers.BaseHandler}
     */
    kassy.handlers.Registration = function(sp) {
        goog.base(this, sp);
    };
    goog.inherits(kassy.handlers.Registration, kassy.handlers.BaseHandler);
    var Registration = kassy.handlers.Registration;

    /** @override */
    Registration.prototype.handle_ = function(path) {
        this.setContentTitle('Регистрация');
        this.setContentText(kassy.views.auth.Registration());
        //this.setScroll();

        var firstnameEl = goog.dom.getElement('firstname');
        var lastnameEl = goog.dom.getElement('lastname');
        var emailEl = goog.dom.getElement('email');
        var passwordEl = goog.dom.getElement('password');
        var password2El = goog.dom.getElement('password2');

        var commentEl = goog.dom.getElement('auth_comment');
        var alertEl = goog.dom.getElement('auth_alert');

        /*var tabedEls = goog.array.toArray(goog.dom.query("[tabindex]"));

        goog.array.sort(tabedEls, function(a, b) {
            return ~~a.getAttribute('tabindex') - ~~b.getAttribute('tabindex');
        });*/

        this.handler.listen(this.getContentElement(), [goog.events.EventType.FOCUS, goog.events.EventType.FOCUSIN], function(e) {
            if (e.target.tagName.toLowerCase() == 'input') {
                window.console.log('FOCUSIN');

                goog.dom.setTextContent(commentEl, e.target.getAttribute('data-comment'));

                if (e.target.getAttribute('type') == 'password') {
                    goog.dom.setTextContent(alertEl, '');
                }

                /*window['plugins']['SoftKeyBoard']['show'](function() {
                    window.console.log('SHOW KEYBOARD WIN');
                }, function() {
                    window.console.log('SHOW KEYBOARD FAIL');
                });*/
            }
        });

        this.handler.listen(this.getContentElement(), [goog.events.EventType.BLUR, goog.events.EventType.FOCUSOUT], function(e) {
            if (e.target.getAttribute('type') == 'password' && passwordEl.value != password2El.value) {
                goog.dom.setTextContent(alertEl, 'Пароли не совпадают');
            }
        });

        /*tabedEls[0].focus();

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
            if (goog.dom.classes.has(el, 'registration-btn')) {
                if (passwordEl.value == password2El.value) {
                    kassy.data.execute(new kassy.data.Registration(
                        firstnameEl.value,
                        lastnameEl.value,
                        emailEl.value,
                        passwordEl.value
                    ));
                }
                else {
                    goog.dom.setTextContent(alertEl, 'Пароли не совпадают');
                }
            }
        }, false, this);
    };
});