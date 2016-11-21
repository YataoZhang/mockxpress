## 1. Express 介绍

Express 是一个小巧且灵活的 Node.js Web应用框架，它有一套健壮的特性，可用于开发单页、多页和混合Web应用。

## 2. Express 的应用

##### 2.1 安装express

npm安装
```shell
$ npm install express
```

##### 2.2 使用express

创建http服务
```JS
//引入express
var express = require('express');
//执行express**函数
var app = express();
//监听端口
app.listen(3000);
```

##### 2.3 express的get方法

根据请求路径来处理客户端发出的GET请求

- 第一个参数path为请求的路径
- 第二个参数为处理请求的回调函数

```js
app.get(path,function(req, res));
```

get方法使用：

```js
//引入express
var express = require('./express');
//执行express函数
var app = express();
//监听端口
app.get('/hello', function (req,res) {
   res.end('hello');
});
app.get('/world', function (req,res) {
    res.end('world');
});
app.get('*', function (req,res) {
    res.setHeader('content-type','text/plain;charset=utf8');
    res.end('没有找到匹配的路径');
});
app.listen(3000);
```

get方法实现：

```js
//声明express函数
var express = function () {
    var app = function (req,res) {
        var urlObj  = require('url').parse(req.url,true);
        var pathname = urlObj.pathname;
        var method = req.method.toLowerCase();
        //找到匹配的路由
        var route = app.routes.find(function (item) {
            return item.path==pathname&&item.method==method;
        });
        if(route){
            route.fn(req,res);
        }
        res.end(`CANNOT  ${method} ${pathname}`)
    };
    //增加监听方法
    app.listen = function (port) {
        require('http').createServer(app).listen(port);
    };
    app.routes = [];
    //增加get方法
    app.get = function (path,fn) {
        app.routes.push({method:'get',path:path,fn:fn});
    };
    return app;
};
module.exports = express;
```

使用 * 匹配所有路径：

```js
var route = app.routes.find(function (item) {
-      return item.path==pathname&&item.method==method;
+      return (item.path==pathname||item.path=='*')&&item.method==method;
});
```

##### 2.4 express的post方法

根据请求路径来处理客户端发出的POST请求

- 第一个参数path为请求的路径
- 第二个参数为处理请求的回调函数

```js
app.post(path,function(req,res));
```

post方法的使用：
```js
//引入express
var express = require('./express');
//执行express函数
var app = express();
//监听端口
app.post('/hello', function (req,res) {
   res.end('hello');
});
app.post('*', function (req,res) {
    res.end('post没找到');
});
app.listen(3000);
```

通过linux命令发送post请求
```shell
$ curl -X POST http://localhost:3000/hello
```

post的实现：

增加所有请求的方法
```js
var methods = ['get','post','delete','put','options'];
methods.forEach(function (method) {
    app[method] = function (path,fn) {
        app.routes.push({method:method,path:path,fn:fn});
    };
});
```

##### 2.5 express的all方法

监听所有的请求方法，可以匹配所有的HTTP动词。根据请求路径来处理客户端发出的所有请求

- 第一个参数path为请求的路径
- 第二个参数为处理请求的回调函数

```js
app.all(path,function(req, res));
```

all的方法使用：
```js
var express = require('./express');
var app = express();
app.all('/hello', function (req,res) {
   res.end('hello');
});
app.all('*', function (req,res) {
    res.end('没找到');
});
app.listen(3000);
```

注册所有方法：增加all方法匹配所有method
```js
+  var methods = ['get','post','delete','put','options','all'];
```

all方法的实现：对all方法进行判断
```js
var route = app.routes.find(function (item) {
-      return (item.path==pathname||item.path=='*')&&item.method==method;
+      return (item.path==pathname||item.path=='*')&&(item.method==method||method=='all');
});
```

##### 2.6 中间件

中间件就是处理HTTP请求的函数，用来完成各种特定的任务，比如检查用户是否登录、检测用户是否有权限访问等，它的特点是：

- 一个中间件处理完请求和响应可以把相应数据再传递给下一个中间件
- 回调函数的next参数,表示接受其他中间件的调用，函数体中的next(),表示将请求数据继续传递
- 可以根据路径来区分返回执行不同的中间件

中间件的使用方法：

增加中间件
```js
var express = require('express');
var app = express();
app.use(function (req,res,next) {
    console.log('过滤石头');
    next();
});
app.use('/water', function (req,res,next) {
    console.log('过滤沙子');
    next();
});
app.get('/water', function (req,res) {
    res.end('water');
});
app.listen(3000);
```

use方法的实现：在路由数组中增加中间件
```js
app.use = function (path,fn) {
    if(typeof fn !='function'){
        fn = path;
        path = '/';
    }
    app.routes.push({method:'middle',path:path,fn:fn});
}
```

app方法中增加Middleware判断：
```js
- var route = app.routes.find(function (item) {
-    return item.path==pathname&&item.method==method;
- });
- if(route){
-     route.fn(req,res);
- }
var index = 0;
function  next(){
    if(index>=app.routes.length){
         return res.end(`CANNOT  ${method} ${pathname}`);
    }
    var route = app.routes[index++];
    if(route.method == 'middle'){
        if(route.path == '/'||pathname.startsWith(route.path+'/')|| pathname==route.path){
            route.fn(req,res,next)
        }else{
            next();
        }
    }else{
        if((route.path==pathname||route.path=='*')&&(route.method==method||route.method=='all')){
            route.fn(req,res);
        }else{
            next();
        }
    }
}
next();
```

错误中间件：next中可以传递错误，默认执行错误中间件
```js
var express = require('express');
var app = express();
app.use(function (req,res,next) {
    console.log('过滤石头');
    next('stone is too big');
});
app.use('/water', function (req,res,next) {
    console.log('过滤沙子');
    next();
});
app.get('/water', function (req,res) {
    res.end('water');
});
app.use(function (err,req,res,next) {
    console.log(err);
    res.end(err);
});
app.listen(3000);
```

错误中间件的实现：对错误中间件进行处理
```js
function  next(err){
    if(index>=app.routes.length){
        return res.end(`CANNOT  ${method} ${pathname}`);
    }
    var route = app.routes[index++];
+    if(err){
+        if(route.method == 'middle'&&route.fn.length==4){
+            route.fn(err,req,res,next);
+        }else{
+            next(err);
+        }
+    }else{
        if(route.method == 'middle'){
            if(route.path == '/'||pathname.startsWith(route.path+'/')|| pathname==route.path){
                route.fn(req,res,next)
            }else{
                next();
            }
        }else{
            if((route.path==pathname||route.path=='*')&&(route.method==method||route.method=='all')){
                route.fn(req,res);
            }else{
                next();
            }
        }
+    }
}
```

##### 2.7 获取参数和查询字符串

- `req.hostname` 返回请求头里取的主机名
- `req.path` 返回请求的URL的路径名
- `req.query` 查询字符串

```js
//http://localhost:3000/?a=1
app.get('/',function(req,res){
    res.write(JSON.stringify(req.query))
    res.end(req.hostname+" "+req.path);
});
```

具体实现：对请求增加方法
```js
+     req.path = pathname;
+     req.hostname = req.headers['host'].split(':')[0];
+     req.query = urlObj.query;
```

##### 2.8 获取params参数

req.params 匹配到的所有路径参数组成的对象
```js
app.get('/water/:id/:name/home/:age', function (req,res) {
    console.log(req.params);
    res.end('water');
});
```

params实现：增加params属性
```js
methods.forEach(function (method) {
    app[method] = function (path,fn) {
        var config = {method:method,path:path,fn:fn};
        if(path.includes(":")){
            //是路径参数 转换为正则
            //并且增加params
            var arr = [];
            config.path   = path.replace(/:([^\/]+)/g, function () {
                arr.push(arguments[1]);
                return '([^\/]+)';
            });
            config.params = arr;
        }
        app.routes.push(config);
    };
});
+ if(route.params){
+    var matchers = pathname.match(new RegExp(route.path));
+    if(matchers){
+       var params = {};
+        for(var i = 0; i<route.params.length;i++){
+            params[route.params[i]] = matchers[i+1];
+        }
+        req.params = params;
+        route.fn(req,res);
+    }else{
+        next();
+    }
+}else{
    if((route.path==pathname||route.path=='*')&&(route.method==method||route.method=='all')){
        route.fn(req,res);
    }else{
        next();
    }
+}
```

##### 2.9 express中的send方法

参数为要响应的内容,可以智能处理不同类型的数据,在输出响应时会自动进行一些设置，比如HEAD信息、HTTP缓存支持等等
```js
res.send([body]);
```
当参数是一个字符串时，这个方法会设置Content-type为text/html
```js
app.get('/', function (req,res) {
    res.send('<p>hello world</p>');
});
```
当参数是一个Array或者Object，这个方法返回json格式
```js
app.get('/json', function (req,res) {
     res.send({obj:1});
});
app.get('/arr', function (req,res) {
 res.send([1,2,3]);
});
```
当参数是一个number类型，这个方法返回对应的状态码短语
```js
app.get('/status', function (req,res) {
    res.send(404); //not found
    //res.status(404).send('没有找到');设置短语
});
```

send方法的实现：自定义send方法
```js
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
```

## 3. 模板的应用

##### 3.1 安装ejs

npm安装ejs
```shell
$ npm install ejs
```

##### 3.2 设置模板

使用ejs模版
```js
var express = require('express');
var path = require('path');
var app = express();
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.listen(3000);
```

##### 3.3 渲染html

配置成html格式
```js
app.set('view engine','html')
app.set('views',path.join(__dirname,'views')); 
app.engine('html',require('ejs').__express);
```


##### 3.4 渲染视图

- 第一个参数 要渲染的模板
- 第二个参数 渲染所需要的数据

```js
app.get('/', function (req,res) {
    res.render('hello',{title:'hello'},function(err,data){});
});
```

##### 3.5 模板的实现

读取模版渲染
```js
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
```


## 4. 静态文件服务器

如果要在网页中加载静态文件（css、js、img），就需要另外指定一个存放静态文件的目录，当浏览器发出非HTML文件请求时，服务器端就会到这个目录下去寻找相关文件
```js
var express = require('express');
var app = express();
var path = require('path');
app.use(express.static(path.join(__dirname,'public')));
app.listen(3000);
```

##### 4.1 静态文件服务器实现

配置静态服务器
```js
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

```

## 5. 重定向

redirect方法允许网址的重定向，跳转到指定的url并且可以指定status，默认为302方式。

- 参数1 状态码(可选)
- 参数2 跳转的路径

```js
res.redirect([status], url);
```

##### 5.1 redirect使用

使用重定向
```js
app.get('/', function (req,res) {
    res.redirect('http://www.baidu.com')
});
```

##### 5.2 redirect的实现

302重定向
```js
res.redirect = function (url) {
    res.status(302);
    res.headers('Location', url || '/');
    res.sendHeader();
    res.end();
};
```

## 6. 接收 post 响应体

安装body-parser
```shell
$ npm install body-parser
```

##### 6.1 使用body-parser

接收请求体中的数据
```js
app.get('/login', function (req,res) {
    res.sendFile('./login.html',{root:__dirname})
});
app.post('/user', function (req,res) {
    console.log(req.body);
    res.send(req.body);
});
app.listen(3000);
```
##### 6.2 req.body的实现

实现bodyParser
```js
function bodyParser () {
    return function (req,res,next) {
        var result = '';
        req.on('data', function (data) {
            result+=data;
        });
        req.on('end', function () {
            try{
                req.body = JSON.parse(result);
            }catch(e){
                req.body = require('querystring').parse(result);
            }
            next();
        })
    }
};
```
## 源代码地址
[https://github.com/YataoZhang/mockxpress][1]


  [1]: https://github.com/YataoZhang/mockxpress
