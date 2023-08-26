var createError = require('http-errors');
var express = require('express');
var app = express();
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var conn = require('./conf/database');
app.io = require('socket.io')();

//router
var indexRouter = require('./routes/index');
var emailRouter = require('./routes/email');
var registerRouter = require('./routes/register');
var loginRouter = require('./routes/login');
var boardRouter = require('./routes/board');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser('1234ABCD23!'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: '1234ABCD23!',
  resave: false,
  saveUninitialized: true,
  rolling:true,
  cookie: {
    httpOnly: false,
    secure: false
  } 
}))

//chat 
app.io.on('connection',function(socket){
  socket.emit('message', '');  // 채팅창 처음 로딩됐을 때 보낼 메시지 
  socket.on('msg', function(data){
    app.io.emit('message', data);
  })
  socket.on('idauth', function(data){
   conn.query('SELECT * FROM usertable WHERE userid = ?', [data], function(error,results){
    if (error) throw error;
    if (results.length == 0){
      app.io.emit('idauthO', '사용가능한 ID입니다.')
    }else{
      app.io.emit('idauthX','사용중인 ID입니다. 다른 ID를 입력해주세요.')    
    }
  })
}) 
socket.on('emailauth', function(data){
  conn.query('SELECT * FROM usertable WHERE email = ?', [data], function(error,results){
   if (error) throw error;
   if (results.length == 0){
     app.io.emit('emailauthO', '사용가능한 Email입니다.')
   }else{
     app.io.emit('emailauthX','사용중인 Email입니다. 다른 Email를 입력해주세요.')    
   }
 })
})
socket.on('registerauth', function(data){
  if(data == `${emailRouter.randomCode}`){
    app.io.emit('registerauthO', 'success')
  } else if( data != `${emailRouter.randomCode}`){
    app.io.emit('registerauthX', 'failed')
  }

})
});



//path 
app.use('/', indexRouter);
app.use('/email', emailRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/board',boardRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
