goog.provide('kassy.data.Registration');

goog.require('kassy.data.Command');

goog.scope(function() {
    /**
     * @param {string} firstname
     * @param {string} lastname
     * @param {string} email
     * @param {string} password
     * @constructor
     * @extends {kassy.data.Command}
     */
    kassy.data.Registration = function(firstname, lastname, email, password) {
        goog.base(this, { module: 'registration' },
            {
                model: 'params',
                params: { 'firstname': firstname, 'lastname': lastname, 'email': email, 'password': password }
            },
            function(jsData, jsErrors) {

                if (jsErrors && goog.isDef(jsErrors.length) && jsErrors.length > 0) {
                    kassy.ui.alert(goog.array.reduce(jsErrors, function(text, jsError, index, jsErrors) {
                        return text + jsError['code'] + ': ' + jsError['message'] + (index < jsErrors.length - 1 ? '\n' : '');
                    }, ''), 'Ошибка', 'OK');
                }

                var userId = (jsData !== null ? jsData['user_id'] : null);
                window.console.log('REG USER ID: ' + userId);

                if (userId === null) {
                    window.console.log('REG FAILED');
                }
                else {
                    window.console.log('REG OK');
                    //kassy.settings.setUserToken(token);
                    window.history.go(-1);
                }
            }
        );
    };
    goog.inherits(kassy.data.Registration, kassy.data.Command);
});