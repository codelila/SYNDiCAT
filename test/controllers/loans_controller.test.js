var app, compound
, request = require('supertest')
, sinon   = require('sinon');

function LoanStub () {
    return {
        nr: '',
        value: '',
        cancelation_period: '',
        minimum_term: '',
        start_date: '',
        rate_of_interest: '',
        loaner_name: '',
        loaner_address: '',
        contract_state: '',
        loan_state: '',
        date_contract_sent_to_loaner: '',
        date_contract_signature_received: '',
        date_loan_loaned: '',
        date_loan_repaid: ''
    };
}

describe('LoanController', function() {
    beforeEach(function(done) {
        app = getApp();
        compound = app.compound;
        compound.on('ready', function() {
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

    /*
     * GET /loans/:id
     * Should render loans/index.ejs
     */
    it('should access Loan#find and render "show" template on GET /loans/:id', function (done) {
        var Loan = app.models.Loan;

        // Mock Loan#find
        Loan.find = sinon.spy(function (id, callback) {
            callback(null, new Loan);
        });

        request(app)
        .get('/loans/42')
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Loan.find.calledWith('42').should.be.true;
            app.didRender(/loans\/show\.ejs$/i).should.be.true;

            done();
        });
    });

    /*
     * POST /loans
     * Should access Loan#create when Loan is valid
     */
    it('should access Loan#create on POST /loans with a valid Loan', function (done) {
        var Loan = app.models.Loan
        , loan = new LoanStub;

        // Mock Loan#create
        Loan.create = sinon.spy(function (data, callback) {
            callback(null, loan);
        });

        request(app)
        .post('/loans')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(302);
            Loan.create.calledWith(loan).should.be.true;

            done();
        });
    });

    /*
     * POST /loans
     * Should fail when Loan is invalid
     */
    it('should fail on POST /loans when Loan#create returns an error', function (done) {
        var Loan = app.models.Loan
        , loan = new LoanStub;

        // Mock Loan#create
        Loan.create = sinon.spy(function (data, callback) {
            callback(new Error, loan);
        });

        request(app)
        .post('/loans')
        .send({ "Loan": loan })
        .end(function (err, res) {
            res.statusCode.should.equal(200);
            Loan.create.calledWith(loan).should.be.true;

            app.didFlash('error').should.be.true;

            done();
        });
    });

    /*
     * PUT /loans/:id
     * Should redirect back to /loans when Loan is valid
     */
    it('should redirect on PUT /loans/:id with a valid Loan', function (done) {
        var Loan = app.models.Loan
        , loan = new LoanStub;

        Loan.find = sinon.spy(function (id, callback) {
            callback(null, {
                id: 1,
                updateAttributes: function (data, cb) { cb(null) }
            });
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

    /*
     * PUT /loans/:id
     * Should not redirect when Loan is invalid
     */
    it('should fail / not redirect on PUT /loans/:id with an invalid Loan', function (done) {
        var Loan = app.models.Loan
        , loan = new LoanStub;

        Loan.find = sinon.spy(function (id, callback) {
            callback(null, {
                id: 1,
                updateAttributes: function (data, cb) { cb(new Error) }
            });
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
});
