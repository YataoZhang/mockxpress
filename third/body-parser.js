/**
 * Created by zhangyatao on 16/8/23.
 */
var querystring = require('querystring');
function bodyParser() {
    return function (req, res, next) {
        var data = '';
        req.on('data', function (chunk) {
            data += chunk;
        });
        req.on('end', function () {
            try {
                req.body = JSON.parse(data);
            } catch (ex) {
                req.body = querystring.parse(data);
            }
            next();
        });
    }
}
module.exports = bodyParser;