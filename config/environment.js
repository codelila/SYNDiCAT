module.exports = function (compound) {

    var express = require('express');
    var app = compound.app;

    app.configure(function(){
        // FIXME: Factor this out or move to passport, e. g.
        // https://github.com/steve-jansen/passport-reverseproxy
        app.use(function (req, res, next) {
          var headerName = 'remote_user';
          var header = req.headers[headerName];
          if (!header) {
            res.send(403);
            return;
          }
          req.user = {
            id: header,
            name: header,
            isAuthenticated: true
          };
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
