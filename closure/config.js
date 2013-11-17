{
    "id": "kassy",
    "closure-library": "./closure-library/closure/goog/",
    "paths": ["./src/"],
    "inputs": [
        "./src/app.js",
        "./closure-templates/soyutils_usegoog.js",
        "./closure-library/third_party/closure/goog/mochikit/async/deferred.js",
        "./closure-library/third_party/closure/goog/mochikit/async/deferredlist.js",
        "./closure-library/third_party/closure/goog/dojo/dom/query.js"
    ],
    "mode": "SIMPLE",
    "level": "VERBOSE",
    "pretty-print": true,
    "checks": {
        //"accessControls": "ERROR",
        //"visibility": "ERROR",
        "checkRegExp": "ERROR",
        "checkTypes": "ERROR",
        "checkVars": "ERROR",
        "deprecated": "WARNING",
        "fileoverviewTags": "ERROR",
        "invalidCasts": "ERROR",
        "missingProperties": "ERROR",
        "nonStandardJsDocs": "WARNING",
        "undefinedVars": "ERROR"
    }
}