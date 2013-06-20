/*
 db/schema.js contains database schema description for application models
 by default (when using jugglingdb as ORM) this file uses database connection
 described in config/database.json. But it's possible to use another database
 connections and multiple different schemas, docs available at

 http://railwayjs.com/orm.html

 Example of model definition:

 define('User', function () {
     property('email', String, { index: true });
     property('password', String);
     property('activated', Boolean, {default: false});
 });

 Example of schema configured without config/database.json (heroku redistogo addon):
 schema('redis', {url: process.env.REDISTOGO_URL}, function () {
     // model definitions here
 });

*/

var Loan = describe('Loan', function () {
    property('value', Number);
    property('cancelation_period', String);
    property('minimum_term', String);
    property('start_date', String, {default: function () { return '2013-01-01'; }});
    property('rate_of_interest', Number);
    property('loaner_name', String);
    property('loaner_address', Text);
    property('contract_state', String);
    property('loan_state', String);
    property('date_contract_sent_to_loaner', Date);
    property('date_contract_signature_received', Date);
    property('date_loan_loaned', Date);
    property('date_loan_repaid', Date);
    set('restPath', pathTo.loans);
});

