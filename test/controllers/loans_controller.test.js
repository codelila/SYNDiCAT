var app, compound
, request = require('supertest')
, sinon   = require('sinon')
, when = require('when');

var strings = {
  models: {
    Loan: {
      fields: {
        granted_until: 'Kredit gewährt bis'
      }
    }
  },
  validate: {
    date: 'muss ein Datum im Format YYYY-MM-DD sein'
  }
};

var Loan = require('../../app/model/loan_bookshelf.js')(strings);

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
var loanStub = Loan.fromStringHash(loanStubStringHash);

function LoanStub () {
  var _ret = Object.create(loanStub);
  _ret.attributes = Object.create(_ret.attributes);
  return _ret;
}

describe('LoanController', function() {
    beforeEach(function(done) {
        app = getApp();
        compound = app.compound;
        compound.on('ready', function() {
            app.models.Loan = Loan;
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
            res.statusCode.should.equal(200);
            app.didRender(/loans\/new\.ejs$/i).should.be.true;
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
            res.statusCode.should.equal(200);
            app.didRender(/loans\/index\.ejs$/i).should.be.true;
            done();
        });
    });

    /*
     * GET /loans/:id/edit
     * Should access Loan#find and render loans/edit.ejs
     */
/*
    it('should access Loan#find and render "edit" template on GET /loans/:id/edit', function (done) {
        var Loan = app.models.Loan;

        // Mock Loan#find
        Loan.find = sinon.spy(function (id, callback) {
            callback(null, new Loan);
        });

        request(app)
        .get('/loans/42/edit')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Loan.find.calledWith('42').should.be.true;
            app.didRender(/loans\/edit\.ejs$/i).should.be.true;

            done();
        });
    });
*/

    /*
     * GET /loans/:id
     * Should render loans/index.ejs
     */
    it('should access Loan#find and render "show" template on GET /loans/:id', function (done) {
        var Loan = app.models.Loan;

        var fetchedId = null;
        var stub = sinon.stub(Loan.prototype, 'sync', function () {
            var loan = this;
            fetchedId = loan.id;
            return {
              first: function () {
                var res = LoanStub().attributes;
                res.date_created = (new Date()).toISOString();
                return when.resolve([ res ]);
              },
              update: function (attrs) {
                updatedAttrs = attrs;
              }
            }
        });

        request(app)
        .get('/loans/42')
        .set('REMOTE_USER', 'remote user')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            fetchedId.should.equal('42');
            app.didRender(/loans\/show\.ejs$/i).should.be.true;
            stub.restore();

            done();
        });
    });

    /*
     * POST /loans
     * Should access Loan#create when Loan is valid
     */
    it('should access Loan#create on POST /loans with a valid Loan', function (done) {
        var Loan = app.models.Loan
        , loan = loanStubStringHash;

        // Mock Loan#create
        var stub = sinon.spy(Loan, 'fromStringHash', function () {
            return LoanStub();
        });

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            // FIXME Loan.fromStringHash.calledWith(loan).should.be.true;

            Loan.fromStringHash.restore();

            done();
        });
    });

    /*
     * POST /loans
     * Should fail when Loan is invalid
     */
    it('should fail on POST /loans when Loan#create returns an error', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {value: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);

            app.didFlash('error').should.be.true;

            done();
        });
    });

    it('should fail on POST /loans when no rate of interest given', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {rate_of_interest: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);

            app.didFlash('error').should.be.true;

            done();
        });
    });

    it('requires minimum term if cancelation period is given', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '3', minimum_term: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Mindestlaufzeit und Kündigungsfrist müssen zusammen angegeben werden');
            done();
        });
    });

    it('requires cancelation period if minimum term is given', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '3'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Mindestlaufzeit und Kündigungsfrist müssen zusammen angegeben werden');
            done();
        });
    });

    it('requires cancelation period, minimum term or given until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: ''});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Kündigungsfrist oder festes Ablaufdatum muss angegeben werden');
            done();
        });
    });

    it('does not allow cancelation period be given together with granted until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '3', minimum_term: '', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Kündigungsfrist darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden');
            done();
        });
    });

    it('does not allow minimum term be given together with granted until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '3', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Mindestlaufzeit darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden');
            done();
        });
    });

    it('does not allow cancelation period and minimum term be given together with granted until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '3', minimum_term: '3', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Kündigungsfrist darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden');
            done();
        });
    });

    it('accepts granted_until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: '2013-01-01'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            done();
        });
    });

    it('checks format of granted until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: '2013-0101'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Kredit gewährt bis muss ein Datum im Format YYYY-MM-DD sein');
            done();
        });
    });

    it('checks format of granted until', function (done) {
        var Loan = app.models.Loan
        , loan = extend({}, loanStubStringHash, {cancelation_period: '', minimum_term: '', granted_until: '2013-0101'});

        request(app)
        .post('/loans')
        .set('REMOTE_USER', 'remote user')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.flashedMessages.error.should.include('Kredit gewährt bis muss ein Datum im Format YYYY-MM-DD sein');
            done();
        });
    });

    /*
     * PUT /loans/:id
     * Should redirect back to /loans when Loan is valid
     */
/*
    it('should redirect on PUT /loans/:id with a valid Loan', function (done) {
        var Loan = app.models.Loan
        , loan = LoanStub();

        var fetchedId = null;
        Loan.prototype.fetch = sinon.spy(function () {
            var loan = this;
            fetchedId = loan.id;
            return {
              then: function (callback) {
                callback(loan);
              }
            }
        });

        request(app)
        .put('/loans/1')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            res.header['location'].should.include('/loans/1');

            app.didFlash('error').should.be.false;

            done();
        });
    });
*/
    /*
     * PUT /loans/:id
     * Should not redirect when Loan is invalid
     */
/*
    it('should fail / not redirect on PUT /loans/:id with an invalid Loan', function (done) {
        var Loan = app.models.Loan
        , loan = LoanStub();

        var fetchedId = null;
        Loan.prototype.fetch = sinon.spy(function () {
            var loan = this;
            fetchedId = loan.id;
            return {
              then: function (callback) {
                callback(loan);
              }
            }
        });

        request(app)
        .put('/loans/1')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            app.didFlash('error').should.be.true;

            done();
        });
    });
*/
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

    it('should update state on PUT /loans/:id/state', function (done) {
        var Loan = app.models.Loan;

        var fetchedId = null;
        var updatedAttrs = null;
        var stub = sinon.stub(Loan.prototype, 'sync', function () {
            var loan = this;
            fetchedId = loan.id;
            return {
              first: function () {
                var res = LoanStub().attributes;
                res.date_created = (new Date()).toISOString();
                return when.resolve([ res ]);
              },
              update: function (attrs) {
                updatedAttrs = attrs;
              }
            }
        });

        request(app)
        .put('/loans/42/state')
        .set('REMOTE_USER', 'remote user')
        .send('Loan[contract_state]=sent_to_loaner')
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            fetchedId.should.equal('42');
            res.header.location.should.equal('/loans/42');
            updatedAttrs.contract_state.should.equal('sent_to_loaner');
            updatedAttrs.date_contract_sent_to_loaner.should.match(/^\d{4}-\d{2}-\d{2}/);
            updatedAttrs.user_contract_sent_to_loaner.should.equal('remote user');

            stub.restore();
            done();
        });
    });

    // FIXME
    it('should respond with error code on invalid PUT /loans/:id/state', false && function (done) {
        var Loan = app.models.Loan;

        var fetchedId = null;
        var stub = sinon.stub(Loan.prototype, 'sync', function () {
            var loan = this;
            fetchedId = loan.id;
            return {
              first: function () {
                var res = LoanStub().attributes;
                res.date_created = (new Date()).toISOString();
                return when.resolve([ res ]);
              },
              update: function (attrs) {
                updatedAttrs = attrs;
              }
            }
        });

        request(app)
        .put('/loans/42/state')
        .set('REMOTE_USER', 'remote user')
        .send('Loan[contract_]=abc')
        .end(function (err, res) {
            res.statusCode.should.not.equal(302);
            res.statusCode.should.not.equal(200);
            fetchedId.should.equal('42');

            stub.restore();
            done();
        });
    });

});
