var request = require('supertest');
var sinon = require('sinon');
var Loan = require('../../app/model/loan_bookshelf.js');

var app, compound;

describe('Loans View New', function() {
  beforeEach(function(done) {
    app = getApp();
    compound = app.compound;
    compound.on('ready', function() {
      done();
    });
  });

  it('has correctly translated input labels', function (done) {
    request(app)
    .get('/loans/new')
    .expect(/Bankverbindung für jährliche Zinszahlungen/)
    .end(function (err, res) {
      done(err);
    });
  });
});
