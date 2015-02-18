'use strict';

require('should');

global.getApp = function(done) {
    var Loan = null;
    var app = require('compound').createServer();
    app.enable('quiet');
    app.set('getLoan', function() {
      if (!Loan) {
        Loan = require('../app/model/loan_bookshelf.js')(
          app.compound.__localeData[app.settings.defaultLocale] || {},
          app.get('validator'),
          require('./testBookshelf')
        );
      }
      return Loan;
    });

    return app;
};
