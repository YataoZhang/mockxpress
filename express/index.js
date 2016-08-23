/**
 * Created by yataozhang on 8/22/16.
 */
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var response = require('./response');
var request = require('./request');

/**
 * main method
 * @return {app}
 */
function express() {
    
    /**
     * core
     * @param req
     * @param res
     */
    var app = function (req, res) {
        var urlObj = url.parse(req.url, true);
        var pathname = urlObj.pathname;
        var method = req.method.toLocaleLowerCase();
        req.path = pathname;
        req.query = urlObj.query;
        req.hostname = req.headers['host'].split(':')[0];

        req.__proto__ = __request;
        res.__proto__ = __response;

        var index = 0;
        /**
         * 依次处理中间件
         * @param err 错误信息
         */
        function next(err) {
            if (index >= app.routes.length) {
                res.end(`__CANNOT ${method} ${pathname}`);
                return;
            }
            var route = app.routes[index++];
            // console.log(route.fn.toString());
            if (err) {
                if (route.method === 'middleware' && route.fn.length === 4) {
                    route.fn(err, req, res, next);
                } else {
                    next(err);
                }
            } else {
                if (route.method === 'middleware') {
                    if (route.path === '/' || pathname.startsWith(route.path + '/') || pathname === route.path) {
                        // console.log(1)
                        if (route.fn.length === 4) {
                            route.fn(undefined, req, res, next);
                        } else {
                            route.fn(req, res, next);
                        }
                    } else {
                        next();
                    }
                } else {
                    if (route.params) {
                        var matchers = pathname.match(new RegExp(route.path));
                        if (matchers) {
                            var params = {};
                            for (var i = 0; i < route.params.length; i++) {
                                params[route.params[i]] = matchers[i + 1];
                            }
                            req.params = params;
                            route.fn(req, res);
                        } else {
                            next();
                        }
                    } else {
                        if ((route.path === pathname || route.path === '*') && (route.method === method || route.method === 'all')) {
                            route.fn(req, res);
                        } else {
                            next();
                        }
                    }
                }
            }
        }

        next();
        // 往浏览器返回文件是移步的,所以这里必须注释掉
        // res.end(`.  CANNOT ${method} ${pathname}`);
    };
    
    
    // 模版引擎配置
    var engine = app.engineOptions = {
        viewEngineList: {},
        viewsPath: '',
        viewType: ''
    };

    var __request = {__proto__: request, app: app};
    var __response = {__proto__: response, app: app};
    
    // add listen method
    app.listen = function (port) {
        http.createServer(app).listen(port);
    };
    // 中间件队列
    app.routes = [];

    // 绑定http方法
    var methods = ['get', 'post', 'head', 'delete', 'put', 'all'];
    methods.forEach(function (item) {
        app[item] = function (path, fn) {
            var config = {method: item, path: path, fn: fn};
            // 判断是否需要处理参数
            if (path.includes(':')) {
                var arr = [];
                config.path = path.replace(/:([^\/]+)/g, function () {
                    arr.push(arguments[1]);
                    return '([^\/]+)';
                });
                config.params = arr;
            }
            app.routes.push(config);
        }
    });

    // 使用中间件
    app.use = function (path, fn) {
        if (typeof fn !== 'function') {
            fn = path;
            path = '/';
        }
        app.routes.push({method: 'middleware', path: path, fn: fn});
    };

    // 设置模版引擎
    app.set = function (type, value) {
        if (type === 'view engine') {
            engine.viewType = value;
        } else if (type === 'views') {
            engine.viewsPath = value;
        }
    };
    // 注册模版引擎
    app.engine = function (name, fn) {
        engine.viewEngineList[name] = fn;
    };

    return app;
}
/**
 * 设置静态资源
 * @param p 路径
 * @returns {Function}
 */
express.static = function (p) {
    return function (req, res, next) {
        var staticPath = path.join(p, req.path);
        var exists = fs.existsSync(staticPath);
        if (exists) {
            res.sendFile(staticPath);
        } else {
            next();
        }
    }
};

module.exports = express;