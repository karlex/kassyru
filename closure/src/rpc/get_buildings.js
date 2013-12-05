goog.provide('kassy.rpc.GetBuildingList');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    subdivision: kassy.data.SubdivisionModel,
     *    buildingTypes: Array.<kassy.data.BuildingTypeModel>,
     *    buildings: Array.<kassy.data.BuildingModel>
     * }}
     */
    kassy.rpc.BuildingListType;

    /**
     * @param {{
     *   id: (number|undefined),
     *   typeId: (number|undefined),
     *   kind: (number|undefined),
     *   response: function(kassy.rpc.BuildingListType?)
     * }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetBuildingList = function(options) {
        goog.base(this, {
            module: 'page_building',
            data: kassy.rpc.params({
                'id': options.id,
                'type_id': options.typeId,
                'kind': options.kind
            }),
            success: function(response) {
                options.response({
                    subdivision: response.get('subdivision', kassy.data.SubdivisionModel)[0],
                    buildingTypes: response.get('building_type', kassy.data.BuildingTypeModel, function(buildingType) {
                        return buildingType.state === 1;
                    }),
                    buildings: response.get('building', kassy.data.BuildingModel, function(building) {
                        return building.state === 1;
                    })
                })
            },
            error: function() {
                options.response(null);
            }
        });
    };
    goog.inherits(kassy.rpc.GetBuildingList, kassy.rpc.BaseCommand);
});