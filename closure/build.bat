java -jar plovr.jar build config.js > ./www/js/main.js
xcopy .\www\* ..\android\assets\www /s /i /Y
pause