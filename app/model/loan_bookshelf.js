'use strict';

var Tv4Provider = require('../../core/Tv4Provider');
var tv4Provider = new Tv4Provider();
var tv4 = null;

var bookshelf;
var l;
var changeValidator;
var Loan;

module.exports = function(locale, _validator, _bookshelf) {
  // FIXME: Does not really support getting an instance with your locale or validator.
  // Instead, last call overwrites these for all instances.
  // This is still necessary for testability of loans_controller

  l = Object.create(locale);
  l.DATE = 'muss ein Datum im Format YYYY-MM-DD sein';
  l.DATE_TIME = 'muss ein Datum sein';

  changeValidator = _validator;
  bookshelf = _bookshelf;

  tv4 = tv4Provider.getInstance(l);

  getLoan();
  return Loan;
};

var tableName = 'Loan';

var schema = require('../../core/schema');

function getLoan() {
  bookshelf.knex.schema.hasTable(tableName).then(function(exists) {
    if (exists) {
      return;
    }
    bookshelf.knex.schema.createTable(tableName, function (table) {
      table.increments('id');

      var formatBased = {
        'date-time': 'dateTime'
      };

      var typeOverwrites = {
        rate_of_interest: 'decimal',
        loaner_address: 'text',
        notes: 'text'
      };

      // create fields from schema
      Object.keys(schema.properties).forEach(function (key) {
        var prop = schema.properties[key];
        var method = typeOverwrites[key] || formatBased[prop.format] || prop.type;
        var field = table[method](key);
        if (!schema.required.indexOf(key)) {
          field.nullable();
        }
      });
    }).then(console.log, console.log);
  });

  Loan = bookshelf.Model.extend({
    tableName: tableName,
    hasTimestamps: false,
    idAttribute: 'id',
    initialize: function () {
      this.on('creating', function () {
        if (!this.get('date_created')) {
          this.set('date_created', (new Date()).toISOString());
        }
        if (!this.get('user_created')) {
          this.set('user_created', this._curUser);
        }
      }, this);
      this.on('updating', this.validateUpdate, this);
      this.on('saving', this.validate, this);
    },
    validate: function () {
      var attrs = this.attributes;

      // tv4 wrongly tries to validate null values
      Object.keys(attrs).forEach(function (key) {
        if (attrs[key] === null) {
          delete attrs[key];
        }
      });

      var errors = tv4.validateResult(this.attributes, schema);
      if (!errors.valid) {
        if (errors.error.schemaPath === '/anyOf') {
          // FIXME: Translate those
          if (this.attributes.granted_until && this.attributes.cancelation_period) {
            throw 'Kündigungsfrist darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden';
          } else if (this.attributes.granted_until && this.attributes.minimum_term) {
            throw 'Mindestlaufzeit darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden';
          } else if (
            (typeof this.attributes.cancelation_period === 'undefined') !==
            (typeof this.attributes.minimum_term === 'undefined')
          ) {
            throw 'Mindestlaufzeit und Kündigungsfrist müssen zusammen angegeben werden';
          } else if (!this.attributes.cancelation_period && !this.attributes.granted_until) {
            throw 'Kündigungsfrist oder festes Ablaufdatum muss angegeben werden';
          }
        } else {
          throw (errors.error.dataPath ? l.models.Loan.fields[errors.error.dataPath.substr(1)] + ' ' : '') + errors.error.message;
        }
      }
    },
    validateUpdate: function () {
      var error = changeValidator.validateChange({
        user: this._curUser,
        date: Date.now(),
        old: this._previousAttributes,
        diff: this.changed
      });
      if (error) {
        throw new Error(error);
      }
      var loan = this;
      var updateableKeys = [ 'contract_state', 'loan_state' ];

      Object.keys(loan.changed).forEach(function (key) {
        if (loan.changed[key] !== loan._previousAttributes[key]) {
          if (updateableKeys.indexOf(key) !== -1) {
            var skey = (key.substr(0, key.indexOf('_'))) + '_' + loan.get(key);
            loan.set('date_' + skey, (new Date()).toISOString());
            loan.set('user_' + skey, loan._curUser);
          }
        }
      });
    },
    setCurUser: function (user) {
      this._curUser = user;
    },
    toCompoundViewObject: function () {
      var attrs = this.attributes, res = {
        id: this.id,
        constructor: {
          modelName: 'Loan'
        }
      };
      Object.keys(schema.properties).forEach(function (key) {
        res[key] = attrs[key] === null ? '' : attrs[key];
      });
      return res;
    }
  }, {
    fromStringHash: function (hash) {
      Object.keys(schema.properties).forEach(function (key) {
        // FIXME: If this would actually always be a string hash, undefined check would
        // not be necessary
        if (typeof hash[key] !== 'undefined' && hash[key] !== '') {
          var prop = schema.properties[key];
          if (prop.type === 'integer') {
            hash[key] = Number(hash[key]);
          } else if (prop.type === 'number') {
            // FIXME: If this would actually always be a string hash, String() conversion
            // would not be necessary
            hash[key] = Number(String(hash[key]).replace(/,/g, '.'));
          }
        } else {
          delete hash[key];
        }
      });
      return new Loan(hash);
    }
  });

  Loan.Collection = bookshelf.Collection.extend({model: Loan});
}
