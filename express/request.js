/**
 * Created by zhangyatao on 16/8/23.
 */

var http = require('http');
var req = module.exports = {
    __proto__: http.IncomingMessage.prototype
};
req.get = req.header = function header(name) {
    var lc = name.toLowerCase();
    switch (lc) {
        case 'referer':
        case 'referrer':
            return this.headers.referrer
                || this.headers.referer;
        default:
            return this.headers[lc];
    }
};

