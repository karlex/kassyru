goog.provide('kassy.data.BuildingResult');

goog.require('goog.result.SimpleResult');



/**
 * @constructor
 * @extends {goog.result.SimpleResult}
 */
kassy.data.BuildingResult = function() {
    goog.base(this);
};
goog.inherits(kassy.data.BuildingResult, goog.result.SimpleResult);

/**
 * @override
 * @return {Object.<string, kassy.data.BuildingModel>}
 */
kassy.data.BuildingResult.prototype.getValue = function() {
    return /** @type {Object.<string, kassy.data.BuildingModel>} */ (kassy.data.BuildingResult.superClass_.getValue.call(this));
};

/**
 * @param {!function(!kassy.data.BuildingResult)} handler
 * @override
 */
kassy.data.BuildingResult.prototype.wait = function(handler) {
    kassy.data.BuildingResult.superClass_.wait.call(this,
        /** @type {!function(!goog.result.SimpleResult)} */ (handler));
};

/**
 * @override
 * @param {Object.<string, kassy.data.BuildingModel>} value
 */
kassy.data.BuildingResult.prototype.setValue = function(value) {
    kassy.data.BuildingResult.superClass_.setValue.call(this, value);
};