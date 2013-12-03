goog.provide('kassy.rpc.GetBuildingTypes');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    subdivision: kassy.data.SubdivisionModel,
     *    buildingTypes: Array.<kassy.data.BuildingTypeModel>
     * }}
     */
    kassy.rpc.BuildingTypeListType;

    /**
     * @param {{
     *   response: function(kassy.rpc.BuildingTypeListType?)
     * }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetBuildingTypes = function(options) {
        goog.base(this, {
            module: 'page_building_type',
            data: [],
            success: function(response) {
                options.response({
                    subdivision: response.get('subdivision', kassy.data.SubdivisionModel)[0],
                    buildingTypes: goog.array.filter(response.get('building_type', kassy.data.BuildingTypeModel), function(buildingType) {
                        return buildingType.state === 1;
                    })
                })
            },
            error: function() {
                options.response(null);
            }
        });
    };
    goog.inherits(kassy.rpc.GetBuildingTypes, kassy.rpc.BaseCommand);
});