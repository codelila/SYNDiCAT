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
    property('rate_of_interest', Number);
    property('interest_yearly_to', Text);
    property('minimum_term', String); // FIXME: This is an optional number and I don’t want zeroes to appear
    property('cancelation_period', String); // FIXME: This is an optional number and I don’t want zeroes to appear
    property('granted_until', String);

    property('loaner_name', String);
    property('loaner_address', Text);
    property('loaner_email', String);
    property('loaner_phone', String);

    property('notes', Text);

    property('date_created', Date);
    property('user_created', String);

    property('contract_state', String);
    property('loan_state', String);

    property('user_contract_sent_to_loaner', String);
    property('date_contract_sent_to_loaner', Date);
    property('user_contract_signature_received', String);
    property('date_contract_signature_received', Date);
    property('user_contract_signature_sent', String);
    property('date_contract_signature_sent', Date);
    property('user_loan_loaned', String);
    property('date_loan_loaned', Date);
    property('user_loan_repaid', String);
    property('date_loan_repaid', Date);

    set('restPath', pathTo.loans);
});

