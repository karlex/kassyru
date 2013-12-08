goog.provide('kassy.ui.downloadFile');

/**
 * @param {string} url - for example "http://sub.main.com/img/000.jpg"
 * @param {function(string?)} callback - first argument is fullPath or null
 * @param {boolean=} opt_cacheInMem - указывает, нужно ли подгрузить картинку в память после сохранения
 */
kassy.ui.downloadFile = function(url, callback, opt_cacheInMem) {
    var fail = function(error) {
        window.console.log('FILE DOWNLOAD WAS FAILED: ' + error);
        callback(null);
    };

    if (url) {
        var localFileName = url.substring(url.lastIndexOf('/') + 1);

        window['requestFileSystem'](window['LocalFileSystem']['TEMPORARY'], 0, function(fileSystem) {
            window.console.log('FILE SYSTEM WAS RECIEVED');

            fileSystem['root']['getFile'](localFileName, {'create': true, 'exclusive': false}, function(fileEntry) {
                window.console.log('FILE WAS CREATED:' + fileEntry['fullPath']);

                var localPath = fileEntry['fullPath'];
                if (window['device']['platform'] === "Android" && localPath.indexOf("file://") === 0) {
                    localPath = localPath.substring(7);
                }

                var ft = new window['FileTransfer']();
                ft['download'](encodeURI(url), localPath, function(entry) {
                    window.console.log('FILE WAS DOWNLOADED:' + entry['fullPath']);

                    // Если нужно грузим изображение в память, затем дергаем callback, иначе сразу дергаем callback
                    if (opt_cacheInMem) {
                        var img = new Image();
                        img.onload = goog.partial(callback, entry['fullPath']);
                        img.src = entry['fullPath'];
                    } else {
                        callback(entry['fullPath']);
                    }

                }, fail);
            }, fail);
        }, fail);
    }
    else {
        fail('Url is undefined!');
    }
};