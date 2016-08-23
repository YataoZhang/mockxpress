/**
 * Created by zhangyatao on 16/8/23.
 */
var yunCloud = require('./yunCloud');
var fs = require('fs');
function ntl(filePath, options, callback) {
    fs.readFile(filePath, function (err, data) {
        if (err) {
            return callback(new Error(err));
        }
        var tpl = yunCloud(data.toString(), options);
        return callback(null, tpl);
    });
}
module.exports = ntl;