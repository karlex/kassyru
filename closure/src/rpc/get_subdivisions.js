goog.provide('kassy.rpc.GetSubdivisions');

goog.require('kassy.rpc.BaseCommand');

goog.scope(function () {
    /** @typedef {{
     *    subdivisions: Array.<kassy.data.SubdivisionModel>
     * }}
     */
    kassy.rpc.SubdivisionsType;

    /**
     * @param {{
     *   db: (string|undefined),
     *   response: function(kassy.rpc.SubdivisionsType?)
     * }} options
     * @constructor
     * @extends {kassy.rpc.BaseCommand}
     */
    kassy.rpc.GetSubdivisions = function(options) {
        goog.base(this, {
            withoutDb: true,
            module: 'subdivision',
            data: kassy.rpc.params({
                'db': options.db
            }),
            success: function(response) {
                options.response({
                    subdivisions: goog.array.filter(response.get('subdivision', kassy.data.SubdivisionModel), function(subdivision) {
                        return subdivision.state === 1;
                    })
                })
            },
            error: function() {
                options.response(null);
            }
        });
    };
    goog.inherits(kassy.rpc.GetSubdivisions, kassy.rpc.BaseCommand);
});