/**
 * Created by zhangyatao on 15/9/23.
 */
!function (base) {
    "use strict";
    var global = global, self = this;
    if ("object" === typeof exports && "undefined" !== typeof module) {
        module.exports = base();
    } else if ("function" === typeof define && define.amd) {
        define([], base);
    } else {
        var platform;
        if ("undefined" !== typeof window) {
            platform = window;
        } else {
            platform = void 0 !== typeof global ? global : self;
        }
        platform.yunCloud = base();
    }
}(function () {
    "use strict";
    var decodeCharacterEntities = {
        "&lt;": "<",
        "&gt;": ">",
        "&nbsp;": " ",
        "&quot;": "\"",
        "&amp;": "&"
    };
    var encodeCharacterEntities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        " ": "&nbsp;",
        "\"": "&quot;"
    };
    var LimitableMap = function () {
        this.map = {};
    };
    LimitableMap.prototype.set = function (len, text, value) {
        return (this.map[len] || ( this.map[len] = {}))[text] = value;
    };
    LimitableMap.prototype.get = function (len) {
        return this.map[len] || {};
    };
    var util = {
        noop: function (x) {
            return x || '';
        },
        forIn: function (obj, callback) {
            for (var n in obj) {
                if (obj.hasOwnProperty(n)) {
                    callback.call(null, n, obj[n]);
                }
            }
        },
        extend: function (o, n) {
            this.forIn(o, function (key) {
                var val = n[key];
                o[key] = val === void 0 ? o[key] : val;
            });
        },
        trim: function (str) {
            if (''.trim) {
                return ('' + str).trim();
            }
            return str.replace(/^\s+|\s+$/g, '');
        }
    };
    var regList = {
        matchReg: /^([\S\s]+?)(|\|([\S\s]+))$/,
        convert: /<%-([\S\s]+?)%>/g,
        val: /<%&([\S\s]+?)%>/g,
        origin: /<%=([\S\s]+?)%>/g,
        expression: /<%([\s\S]+?)%>/g
    };
    var globalSetting = {
        loose: true,
        cache: true,
        strip: true
    };
    var RenderAdapter = function () {
        this.cacheList = new LimitableMap();
        this.event = {};
    };
    RenderAdapter.prototype = {
        constructor: RenderAdapter,
        render: function (str) {
            
            var that = this;
            var parasitic = '';
            if (globalSetting.loose) {
                parasitic = 'data.';
            }
            var tpl = '';
            if (globalSetting.strip) {
                tpl = str.replace(/\s/g, ' ');
            } else {
                tpl = str.replace(/\n/g, '\\n');
                tpl = tpl.replace(/\r/g, '\\r');
                tpl = tpl.replace(/\f/g, '\\f');
                tpl = tpl.replace(/\t/g, '\\t');
                tpl = tpl.replace(/\v/g, '\\v');
            }
            tpl = tpl.replace(/\'/g, '\\\'');
            if (regList.convert.test(str)) {
                tpl = tpl.replace(regList.convert, function (match, code) {
                    return '\' + transfer("encode",' + parasitic + code + '||\"\") + \'';
                });
            }
            if (regList.val.test(str)) {
                tpl = tpl.replace(regList.val, function (match, code) {
                    return '\'+ ' + code + '+\'';
                });
            }
            if (regList.origin.test(str)) {
                tpl = tpl.replace(regList.origin, function (match, code) {
                    code = parasitic + code;
                    if (/\|/.test(code = util.trim(code))) {
                        var funcName = code.match(regList.matchReg);
                        return '\'+ (' + (that.event[util.trim(funcName[3])] || util.noop).toString() + ')(' + funcName[1] + ') +\'';
                    }
                    return '\'+(' + code + '||\"\")+\'';
                });
            }
            if (regList.expression.test(str)) {
                tpl = tpl.replace(regList.expression, function (match, code) {
                    return '\');\n' + code + '\ntpl.push(\'';
                });
            }
            tpl = tpl.replace(/'\n/g, '\'').replace(/\n\'/gm, '\'').replace(/\\(?!f|n|r|t|v)/g, '\\\\');
            tpl = 'tpl.push(\'' + tpl + '\');';
            tpl = tpl.replace(/tpl\.push\((''|'[\\n\s]+)'\);/g, '');
            var argu = '';
            if (globalSetting.loose) {
                tpl = 'var tpl=[];' + tpl + '\nreturn tpl.join(\'\');';
                argu = 'data';
            } else {
                tpl = 'var tpl=[];\nwith(obj||{}){\n' + tpl + '\n}\nreturn tpl.join(\'\');';
                argu = 'obj';
            }

            return new Function(argu, 'transfer', tpl);
        },
        storageCache: function (temp) {
            var that = this;
            var renderTpl = this.cacheList.get(temp.length)[temp];
            if (renderTpl) {
                return renderTpl;
            }
            renderTpl = this.render(temp);
            return this.cacheList.set(temp.length, temp, function (obj) {
                return renderTpl(obj, that.transfer);
            });
        },
        transfer: function (type, str) {
            var transferCallback = function (key, value) {
                str = str.replace(new RegExp(key, 'g'), value);
            };
            if (type === 'encode') {
                util.forIn(encodeCharacterEntities, transferCallback);
            } else {
                util.forIn(decodeCharacterEntities, transferCallback);
            }
            return str;
        }
    };
    RenderAdapter.obtain = new RenderAdapter();
    var manger = {
        template: function (temp) {
            if (globalSetting.cache) {
                return RenderAdapter.obtain.storageCache(temp);
            }
            return function (obj) {
                return RenderAdapter.obtain.render(temp)(obj, RenderAdapter.obtain.transfer);
            };
        }
    };
    /**
     * 编译模版
     * @param {string} str 模版字符串
     * @param {Object} data 模版数据
     * @returns {*}
     */
    var yunCloud = function (str, data) {
        if (arguments.length === 1) {
            return manger.template(str);
        }
        return manger.template(str)(data);
    };
    /**
     * 注册过滤器
     * @param {string} funcName 过滤器名称
     * @param {Function} callback 回调函数
     */
    yunCloud.register = function (funcName, callback) {
        RenderAdapter.obtain.event[funcName] = callback;
    };
    /**
     * 解除过滤器
     * @param {string} funcName 过滤器名称
     */
    yunCloud.unRegister = function (funcName) {
        delete RenderAdapter.obtain.event[funcName];
    };
    /**
     * 设置
     * @param {Object} settings
     */
    yunCloud.set = function (settings) {
        util.extend(globalSetting, settings);
    };
    return yunCloud;
});