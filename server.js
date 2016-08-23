/**
 * Created by yataozhang on 8/22/16.
 */
var path = require('path');
var express = require('./express');
// 引入第三方请求主体格式化工具
var bodyParser = require('./thirdMiddleware/body-parser');
// 引入第三方模版引擎
var ntl = require('./thirdMiddleware/ntl');
// 启动express
var app = express();

// 设置模版引擎

// 将模版引擎设置为ntl
app.set('view engine', 'ntl');
// 设置模版文件路径
app.set('views', path.join(__dirname, 'public/view'));
// 注册模版引擎ntl
app.engine('ntl', ntl);


// 设置静态资源路径
app.use(express.static(path.join(__dirname, 'public')));


// 设置中间件
app.use(function (req, res, next) {
    console.log('过滤石头');
    // next('stone is too big');
    next();
});
app.use('/water', function (req, res, next) {
    console.log('过滤沙子');
    next();
});

// post方法,接受post时使用bodyParser
app.use('/post', bodyParser);

// 错误中间件
app.use(function (err, req, res, next) {
    res.send(err);
});

app.get('/water/:id/:name/home/:age', function (req, res) {
    console.log(req.params);
    // res.send(req.query);
    res.send(400);
    // res.write(JSON.stringify(req.query));
    // res.send('water:' + req.hostname + '  ' + req.path);
});


// 模版请求地址
app.get('/template/:id', function (req, res) {
    res.render('index', {
        title: 'ntl title',
        content: 'hello express view engine',
        id: req.params.id
    });
});

// http get方法 ,路径为/get
app.get('/get', function (req, res) {
    res.send('hello');
});

app.post('/post', function (req, res) {
    console.log(req.body);
    res.send('this is post method');
});

// 使用重定向
app.get('/login', function (req, res) {
    res.redirect('/index')
});
app.get('/index', function (req, res) {
    res.send('welcome to index');
});

// 剩余的get方法请求
app.get('*', function (req, res) {
    res.send('note find match path');
});


// 监听端口
app.listen(3000);