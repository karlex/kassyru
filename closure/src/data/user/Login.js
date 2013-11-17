goog.provide('kassy.data.Login');

goog.require('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {string} email
     * @param {string} password
     * @constructor
     * @extends {kassy.data.Command}
     */
    kassy.data.Login = function(email, password) {
        goog.base(this, { module: 'login' },
        {
            model: 'params',
            params: { 'email': email, 'password': password }
        },
        function(jsData, jsErrors) {

            if (jsErrors && goog.isDef(jsErrors) && jsErrors.length > 0) {
                kassy.ui.alert(goog.array.reduce(jsErrors, function(text, jsError, index, jsErrors) {
                    return text + jsError['code'] + ': ' + jsError['message'] + (index < jsErrors.length - 1 ? '\n' : '');
                }, ''), 'Ошибка', 'OK');
            }

            var token = (jsData !== null ? jsData['token'] : null);
            window.console.log('LOGIN TOKEN: ' + token);

            if (token === null) {
                window.console.log('LOGIN FAILED');
            }
            else {
                window.console.log('LOGIN OK');
                kassy.settings.setUserLoginPassword(email, password);
                kassy.settings.setUserToken(token);
                window.history.go(-1);
            }
        });
    };
    goog.inherits(kassy.data.Login, kassy.data.Command);
});