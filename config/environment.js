module.exports = function (compound) {

    var express = require('express');
    var app = compound.app;

    app.configure(function(){
        app.use(function (req, res, next) {
          req.isAuthenticated = !!req.headers.remote_user;
          if (req.isAuthenticated) {
            req.user = {
              id: req.headers.remote_user,
              name: req.headers.remote_user,
              isAuthenticated: true
            };
          }
          next();
        });
        app.use(require('./authorization'));
        //app.use(express.static(app.root + '/public', { maxAge: 86400000 }));
        app.set('jsDirectory', '/javascripts/');
        app.set('cssDirectory', '/stylesheets/');
        app.set('cssEngine', 'stylus');
        app.set('i18n', 'on');
        app.set('defaultLocale', 'de');
        app.set('autoupdate', 'on');

        app.use(express.bodyParser());
        app.use(express.cookieParser('secret'));
        app.use(express.session({secret: 'secret'}));
        app.use(express.methodOverride());
        app.use(app.router);
    });
};
