'use strict';

var app
, assert = require('assert')
, request = require('supertest')
, sinon = require('sinon');

var Loan;

function extend(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
}

var loanStubStringHash = {
  value: '1000',
  cancelation_period: '3',
  minimum_term: '3',
  rate_of_interest: '0',
  loaner_name: 'Loaner Name',
  loaner_address: 'Loaner Address',
  contract_state: '',
  loan_state: '',
  date_contract_sent_to_loaner: '',
  date_contract_signature_received: '',
  date_loan_loaned: '',
  date_loan_repaid: '',
  user_created: 'me'
};

function LoanStub () {
  var _ret = Object.create(Loan.fromStringHash(loanStubStringHash));
  _ret.attributes = Object.create(_ret.attributes);
  return _ret;
}

describe('SYNDiCAT', function() {
    beforeEach(function(done) {
        app = getApp();
        process.nextTick(function() {
          Loan = app.settings.getLoan();
          done();
        });
    });

    /*
     * GET /loans/new
     * Should render loans/new.ejs
     */
    it('should render "new" template on GET /loans/new', function (done) {
        request(app)
        .get('/loans/new')
        .set('REMOTE_USER', 'remote user')
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            // Make sure there is a form
            assert.ok(res.text.match(/<form action="\/loans" method="POST" id="loan-form"/));
            // Make sure it's empty
            assert.ok(res.text.match(/<input name="Loan\[value\]" id="Loan_value" type="text" value="" \/>/));
            done();
        });
    });

    /*
     * GET /loans
     * Should render loans/index.ejs
     */
    it('should render "index" template on GET /loans', function (done) {
        request(app)
        .get('/loans')
        .set('REMOTE_USER', 'remote user')
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.ok(res.text.match(/<table class="table table-striped">/));
            done();
        });
    });

    /*
     * GET /loans/:id
     * Should render loans/index.ejs
     */
    it('should render "show" template on GET /loans/:id', function (done) {
        var loan = Loan.forge(LoanStub().attributes);

        loan.save().then(function (loan) {
          request(app)
          .get('/loans/' + loan.id)
          .set('REMOTE_USER', 'remote user')
          .end(function (err, res) {
              assert.equal(res.statusCode, 200);
              assert.ok(res.text.match(loan.id));
              assert.ok(res.text.match(/Loaner Name/));

              done();
          });
        });
    });

    it('should access Loan#find and render json on GET /loans/:id.json', function (done) {
        var loan = Loan.forge(LoanStub().attributes);

        loan.save().then(function (loan) {
          request(app)
          .get('/loans/' + loan.id + '.json')
          .set('REMOTE_USER', 'remote user')
          .end(function (err, res) {
              assert.equal(res.statusCode, 200);
              assert.ok(res.text.match(loan.id));
              assert.ok(res.text.match(/Loaner Name/));

              done();
          });
        });
    });

    /*
     * POST /loans
     * Should access Loan#create when Loan is valid
     */
    it('should access Loan#create on POST /loans with a valid Loan', function (done) {
        var loan = loanStubStringHash;

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 302);
            // FIXME: test

            done();
        });
    });

    /*
     * POST /loans
     * Should fail when Loan is invalid
     */
    it('should fail on POST /loans when Loan#create returns an error', function (done) {
        var loan = extend({}, loanStubStringHash, {value: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            // FIXME: Should be a german error message with a german field name
            assert.ok(res.text.match(new RegExp('<div class="alert alert-error">\\s*' +
              '<a class="close" data-dismiss="alert">×</a>\\s*' +
              'Missing required property: value\\s*</div>')));

            done();
        });
    });

    it('should fail on POST /loans when no rate of interest given', function (done) {
        var loan = extend({}, loanStubStringHash, {rate_of_interest: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);

            // FIXME: Should be a german error message with a german field name
            assert.ok(res.text.match(new RegExp('<div class="alert alert-error">\\s*' +
              '<a class="close" data-dismiss="alert">×</a>\\s*' +
              'Missing required property: rate_of_interest\\s*</div>')));

            done();
        });
    });

    it('requires minimum term if cancelation period is given', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '3', minimum_term: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.ok(res.text.match(/Mindestlaufzeit und Kündigungsfrist müssen zusammen angegeben werden/));
            done();
        });
    });

    it('requires cancelation period if minimum term is given', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '3'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.ok(res.text.match(/Mindestlaufzeit und Kündigungsfrist müssen zusammen angegeben werden/));
            done();
        });
    });

    it('requires cancelation period, minimum term or given until', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.ok(res.text.match(/Kündigungsfrist oder festes Ablaufdatum muss angegeben werden/));
            done();
        });
    });

    it('does not allow cancelation period be given together with granted until', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '3', minimum_term: '', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.notEqual(res.text.indexOf('Kündigungsfrist darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden'), -1);
            done();
        });
    });

    it('does not allow minimum term be given together with granted until', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '3', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.notEqual(res.text.indexOf('Mindestlaufzeit darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden'), -1);
            done();
        });
    });

    it('does not allow cancelation period and minimum term be given together with granted until', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '3', minimum_term: '3', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.notEqual(res.text.indexOf('Kündigungsfrist darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden'), -1);
            done();
        });
    });

    it('accepts granted_until', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 302);
            done();
        });
    });

    it('checks format of granted until', function (done) {
        var loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: '2013-0101'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            assert.equal(res.statusCode, 200);
            assert.notEqual(res.text.indexOf('Kredit gewährt bis muss ein Datum im Format YYYY-MM-DD sein'), -1);
            done();
        });
    });

    /*
     * DELETE /loans/:id
     * -- TODO: IMPLEMENT --
     */
    it('should delete a Loan on DELETE /loans/:id');

    /*
     * DELETE /loans/:id
     * -- TODO: IMPLEMENT FAILURE --
     */
    it('should not delete a Loan on DELETE /loans/:id if it fails');

    // FIXME: remote user is not allowed to update loan state
    it('should update state on PUT /loans/:id/state', false);

    // FIXME
    it('should respond with error code on invalid PUT /loans/:id/state', false);

    it('renders PDF on GET /loans/:id/contract', function (done) {
        request(app)
        .get('/loans/42/contract')
        .set('REMOTE_USER', 'remote user')
        .end(function (err, res) {
            assert(res.text.match(/%PDF-1\.5/));
            done();
        });
    });

    it('Correctly renders state on GET /loans/:id', function (done) {
        var loan = Loan.forge(LoanStub().attributes);

        loan.set('contract_state', 'sent_to_loaner');
        loan.set('loan_state', null);
        loan.set('date_created', (new Date()).toISOString());
        loan.save().then(function (loan) {

          request(app)
          .get('/loans/' + loan.get('id'))
          .set('REMOTE_USER', 'remote user')
          .end(function (err, res) {
              // They are all disabled because the user has no rights
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="sent_to_loaner" disabled\s+checked>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="signature_received" disabled\s*>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[loan_state\]" value="loaned" disabled\s*>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="signature_sent" disabled\s*>/));
              done();
          });
        });
    });

    it('Correctly renders state for fresh loan on GET /loans/:id', function (done) {
        var loan = LoanStub();
        loan.set('contract_state', null);
        loan.set('loan_state', null);

        loan.save().then(function (loan) {

          request(app)
          .get('/loans/' + loan.get('id'))
          .set('REMOTE_USER', 'loanhandler')
          .end(function (err, res) {
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="sent_to_loaner"\s*>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="signature_received" disabled\s*>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[loan_state\]" value="loaned"\s*>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="signature_sent" disabled\s*>/));
              done();
          });
        });
    });

    it('Correctly renders state for submitted loan on GET /loans/:id for paperwork user', function (done) {
        var loan = Loan.forge(LoanStub().attributes);

        loan.set('contract_state', 'sent_to_loaner');
        loan.set('loan_state', 'loaned');
        loan.set('date_created', (new Date()).toISOString());
        loan.save().then(function (loan) {

          request(app)
          .get('/loans/' + loan.get('id'))
          .set('REMOTE_USER', 'signaturehandler')
          .end(function (err, res) {
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="sent_to_loaner" disabled\s+checked>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="signature_received"\s*>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[loan_state\]" value="loaned" disabled\s+checked>/));
              assert(res.text.match(/<input type="checkbox" name="Loan\[contract_state\]" value="signature_sent"\s+disabled\s*>/));
              done();
          });
        });
    });
});
