goog.provide('kassy.settings');

goog.scope(function () {
    /**
     * @constructor
     */
    kassy.Settings = function() {
        this.isDemo = false;
    };
    var Settings = kassy.Settings;

    /**
     * @enum {string}
     */
    Settings.Keys = {
        AUTH_ID: 'kassy_auth_id',
        AUTH_KEY: 'kassy_auth_key',
        REGION_ID: 'kassy_region_id',
        USER_LOGIN: 'kassy_user_login',
        USER_PASSWORD: 'kassy_user_password',
        USER_TOKEN: 'kassy_user_token',
        USE_GPS: 'use_gps',
        USE_PUSH: 'use_push'
    };

    /**
     * @param {string} key
     * @param {string=} opt_def
     * @return {string?}
     * @private
     */
    Settings.prototype.get_ = function(key, opt_def) {
        var value = window.localStorage.getItem(key);
        return value ? (goog.isString(value) ? value : String(value))
                     : (opt_def ? opt_def : null);
    };

    /**
     * @param {string} key
     * @param {string} value
     * @private
     */
    Settings.prototype.set_ = function(key, value) {
        window.localStorage.setItem(key, value);
    };

    Settings.prototype.getAuthId = function() {
        return this.isDemo ? 'demo.kassy.ru' : 'm.kassy.ru';
    };

    Settings.prototype.getAuthKey = function() {
        return this.isDemo ? 'demokey' : 'a619a984648f3e349b2d58b225bafa4f';
    };

    Settings.prototype.getRegionId = function() {
        return this.isDemo ? 'test' : this.get_(Settings.Keys.REGION_ID, 'perm');
    };

    /**
     * @param {string} regionId
     */
    Settings.prototype.setRegionId = function(regionId) {
        this.set_(Settings.Keys.REGION_ID, regionId);
    };

    /**
     * @param {string} login
     * @param {string} password
     */
    Settings.prototype.setUserLoginPassword = function(login, password) {
        this.set_(Settings.Keys.USER_LOGIN, login);
        this.set_(Settings.Keys.USER_PASSWORD, password);
    };

    /**
     * @param {string} token
     */
    Settings.prototype.setUserToken = function(token) {
        this.set_(Settings.Keys.USER_TOKEN, token);
    };

    /** @param {boolean} value */
    Settings.prototype.setUseGPS = function(value) {
        this.set_(Settings.Keys.USE_GPS, value ? 'true' : 'false');
    };

    /** @return {boolean} value */
    Settings.prototype.getUseGPS = function() {
        return (this.get_(Settings.Keys.USE_GPS) === 'true' ? true : false);
    };

    /** @param {boolean} value */
    Settings.prototype.setUsePush = function(value) {
        this.set_(Settings.Keys.USE_PUSH, value ? 'true' : 'false');
    };

    /** @return {boolean} value */
    Settings.prototype.getUsePush = function() {
        return (this.get_(Settings.Keys.USE_PUSH) === 'true' ? true : false);
    };

    /**
     * @type {Array.<{buildingTypeId: number, showTypeId: string}>}
     * @private
     */
    Settings.prototype.ShowBuildingTypeMap_ = [
        {buildingTypeId: 7, showTypeId: 'сп'},
        {buildingTypeId: 8, showTypeId: 'кн'},
        {buildingTypeId: 3, showTypeId: 'дт'},
        {buildingTypeId: 2, showTypeId: 'тр'},
        {buildingTypeId: 12, showTypeId: 'вс'}
    ];

    /**
     * @param {number} buildingTypeId
     * @return {string?}
     */
    Settings.prototype.getShowTypeIdByBuildingTypeId = function(buildingTypeId) {
        var pair = goog.array.find(this.ShowBuildingTypeMap_, function(typePair) {
            return typePair.buildingTypeId == buildingTypeId;
        });

        return pair ? pair.showTypeId : null;
    };

    /**
     * @param {string} showTypeId
     * @return {number?}
     */
    Settings.prototype.getBuildingTypeIdByShowTypeId = function(showTypeId) {
        var pair = goog.array.find(this.ShowBuildingTypeMap_, function(typePair) {
            return typePair.showTypeId == showTypeId;
        });

        return pair ? pair.buildingTypeId : null;
    };

    kassy.settings = new kassy.Settings();
});