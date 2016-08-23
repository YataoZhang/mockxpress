/**
 * Created by yataozhang on 8/22/16.
 */
var _http_server = require('_http_server');
var fs = require('fs');
var path = require('path');
module.exports = function (res, engine) {
    var headersList = {};
    var statusCode = 200;

    /**
     * 设置响应首部
     * @param key
     * @param value
     * @return res
     */
    res.headers = function (key, value) {
        if (typeof key === 'object') {
            for (var n in key) {
                if (!key.hasOwnProperty(n)) continue;
                headersList[n] = key[n]
            }
        } else {
            headersList[key] = value;
        }
        return this;
    };

    /**
     * 设置响应MIME Type
     * @param contentType
     * @returns res
     */
    res.contentType = function (contentType) {
        res.headers({'Content-Type': contentType});
        return this;
    };

    /**
     * 状态码
     * @param num
     * @returns res
     */
    res.status = function (num) {
        if (typeof num === 'number') {
            statusCode = num;
        }
        return this;
    };

    /**
     * 发送整个首部
     * @return res
     */
    res.sendHeader = function () {
        res.writeHead(statusCode, headersList);
        statusCode = 200;
        headersList = {};
        return this;
    };

    /**
     * 发送数据
     * @param msg
     */
    res.send = function (msg) {
        var type = typeof msg;
        if (type === 'string' || Buffer.isBuffer(msg)) {
            res.contentType('text/html').status(200).sendHeader().end(msg);
        } else if (type === 'object') {
            res.contentType('application/json').sendHeader().end(JSON.stringify(msg));
        } else if (type === 'number') {
            res.contentType('text/plain').status(msg).sendHeader().end(_http_server.STATUS_CODES[msg]);
        }
    };

    /**
     * 重定向
     * @param url 地址
     */
    res.redirect = function (url) {
        res.status(302);
        res.headers('Location', url || '/');
        res.sendHeader();
        res.end();
    };

    /**
     * 发送文件
     * @param staticPath
     */
    res.sendFile = function (staticPath) {
        var stream = fs.createReadStream(staticPath);
        stream.pipe(res);
        // stream.on('data', function (chunk) {
        //     if (!res.write(chunk)) {//判断写缓冲区是否写满(node的官方文档有对write方法返回值的说明)
        //         stream.pause();//如果写缓冲区不可用，暂停读取数据
        //     }
        // });
        // stream.on('end', function () {
        //     res.sendHeader();
        //     res.end();
        // });
        // res.on("drain", function () {//写缓冲区可用，会触发"drain"事件
        //     stream.resume();//重新启动读取数据
        // });
    };

    /**
     * 渲染模版引擎
     * @param name 模版文件名称
     * @param data 模版数据
     */
    res.render = function (name, data) {
        var viewEngine = engine.viewEngineList[engine.viewType];
        if (viewEngine) {
            viewEngine(path.join(engine.viewsPath, name + '.' + engine.viewType), data, function (err, data) {
                if (err) {
                    res.status(500).sendHeader().send('view engine failure' + err);
                } else {
                    res.status(200).contentType('text/html').sendHeader().send(data);
                }
            });
        } else {
            res.status(500).sendHeader().send('view engine failure');
        }
    }
};
