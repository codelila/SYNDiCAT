'use strict';

module.exports = function (compound) {

    var Bookshelf = require('bookshelf');
    var express = require('express');
    var app = compound.app;

    app.configure(function(){
        // FIXME: Factor this out or move to passport, e. g.
        // https://github.com/steve-jansen/passport-reverseproxy
        app.use(function (req, res, next) {
          var headerName = 'remote_user';
          var header = req.headers[headerName];
          if (!header && process.env.ADMIN_PARTY) {
            header = String(process.env.ADMIN_PARTY);
          }
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
        app.set('i18n', 'on');
        app.set('defaultLocale', 'de');
        app.set('validator', require('./validation'));
        // Makes getLoan injectable. Sucks.
        if (!app.get('getLoan')) {
          var Loan = null;
          app.set('getLoan', function() {
            if (!Loan) {
              Loan = require('../app/model/loan_bookshelf.js')(
                // localeData is not yet loaded, that's why we need to use a getter.
                // FIXME: Move away from compound i18n component
                app.compound.__localeData[app.settings.defaultLocale] || {},
                app.get('validator'),
                Bookshelf.initialize({
                  client: 'sqlite',
                  connection: {
                    filename: './var/development.sqlite3'
                  }
                })
              );
            }
            return Loan;
          });
        }
        app.use(express.static(app.root + '/public', { maxAge: 86400000 }));
        app.set('jsDirectory', '/javascripts/');
        app.set('cssDirectory', '/stylesheets/');
        app.set('cssEngine', 'stylus');
        app.set('autoupdate', 'on');

        app.use(express.bodyParser());
        app.use(express.cookieParser('secret'));
        app.use(express.session({secret: 'secret'}));
        app.use(express.methodOverride());
        app.use(app.router);
    });
};
