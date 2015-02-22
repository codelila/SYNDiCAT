'use strict';

require('should');

var SyndicatValidator = require('../core/Validators/SyndicatValidator');

global.getApp = function() {
    var Loan = null;
    var app = require('compound').createServer();
    app.set('validator', SyndicatValidator(function (user, right) {
      var table = {
        'receive signed contracts': 'signaturehandler',
        'receive loans': 'loanhandler'
      }
      return table[right] === user;
    })),
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
