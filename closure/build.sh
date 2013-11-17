#!/bin/sh
java -jar plovr.jar build config.js > ./www/js/main.js
cp -rf ./www/ ../ios/www