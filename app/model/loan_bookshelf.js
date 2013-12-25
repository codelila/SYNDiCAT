var Bookshelf = require('bookshelf');
var tv4 = require('tv4');

var l;

module.exports = function(locale) {
  // FIXME: Does not really support getting an instance with your locale, last locale wins for all instances

  l = Object.create(locale);
  l.FORMAT_CUSTOM = '{message}';

  tv4.addLanguage('custom', l);
  tv4.language('custom');

  tv4.addFormat('date', function (data, schema) {
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return null;
    }
    return 'muss ein Datum im Format YYYY-MM-DD sein';
  });

  var dateTimeRegex = new RegExp(
    '^' +
    '(\\d{4})\\-(\\d{2})\\-(\\d{2})' +        // full-date
    '[T ]' +
    '(\\d{2}):(\\d{2}):(\\d{2})(\\.\\d+)?' +  // partial-time
    '(Z|(?:([\\+|\\-])(\\d{2}):(\\d{2})))' +  // time-offset
    '$'
  );
  tv4.addFormat('date-time', function (data, schema) {
    if (typeof data === 'string' && dateTimeRegex.test(data)) {
      return null;
    }
    return 'muss ein Datum sein';
  });

  return Loan;
};

Bookshelf.Initialize({
  client: 'sqlite',
  connection: {
    filename : './var/development.sqlite3'
  }
});

var tableName = 'Loan';

var schema = {
  required: [
    'value', 'loaner_name', 'loaner_address', 'date_created', 'user_created'
  ], properties: {
    value: {
      type: 'integer',
      exclusiveMinimum: 0
    },
    minimum_term: {
      type: 'integer',
      exclusiveMinimum: 0
    },
    cancelation_period: {
      type: 'integer'
    },
    granted_until: {
      type: 'string',
      format: 'date'
    },
    rate_of_interest: {
      type: 'number',
      minimum: 0
    },
    loaner_name: {
      type: 'string'
    },
    loaner_address: {
      type: 'string'
    },
    loaner_phone: {
      type: 'string'
    },
    loaner_email: {
      type: 'string'
    },
    notes: {
      type: 'string'
    },
    contract_state: {
      type: 'string'
    },
    loan_state: {
      type: 'string'
    },
    date_created: {
      type: 'string',
      format: 'date-time'
    },
    user_created: {
      type: 'string'
    }
  }, anyOf: [
    {
      required: [ 'minimum_term', 'cancelation_period' ],
      not: {
        required: [ 'granted_until' ]
      }
    }, {
      required: [ 'granted_until' ],
      not: {
        anyOf: [{
          required: [ 'minimum_term' ]
        }, {
          required: [ 'cancelation_period' ]
        }]
      }
    }
  ]
}

Bookshelf.Knex.Schema.createTable(tableName, function (table) {
  table.string('user_contract_sent_to_loaner').nullable();
  table.dateTime('date_contract_sent_to_loaner').nullable();
  table.string('user_contract_signature_received').nullable();
  table.dateTime('date_contract_signature_received').nullable();
  table.string('user_contract_signature_sent').nullable();
  table.dateTime('date_contract_signature_sent').nullable();
  table.string('user_loan_loaned').nullable();
  table.dateTime('date_loan_loaned').nullable();
  table.string('user_loan_repaid').nullable();
  table.dateTime('date_loan_repaid').nullable();

  table.increments('id');

  var typeOverwrites = {
    rate_of_interest: 'decimal',
    loaner_address: 'text',
    notes: 'text',
    date_created: 'dateTime'
  };

  // create fields from schema
  Object.keys(schema.properties).forEach(function (key) {
    var prop = schema.properties[key];
    var field = table[typeOverwrites[key] || prop.type](key);
    if (!schema.required.indexOf(key)) {
      field.nullable();
    }
  });
});

var Loan = Bookshelf.Model.extend({
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
    var errors = tv4.validateResult(this.attributes, schema);
    if (!errors.valid) {
      if (errors.error.schemaPath === '/anyOf') {
        // FIXME: Translate those
        if (this.attributes.granted_until && this.attributes.cancelation_period) {
          throw 'Kündigungsfrist darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden';
        } else if (this.attributes.granted_until && this.attributes.minimum_term) {
          throw 'Mindestlaufzeit darf nicht gleichzeitig mit einem festen Ablaufdatum angegeben werden';
        } else if(!!this.attributes.cancelation_period !== !!this.attributes.minimum_term) {
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
    var loan = this;
    var updateableKeys = [ 'contract_state', 'loan_state' ];
    Object.keys(schema.properties).forEach(function (key) {
      if (loan.attributes[key] !== loan._previousAttributes[key]) {
        if (updateableKeys.indexOf(key) === -1) {
          throw new Error('Not allowed to update ' + key);
        } else {
          var skey = (key.substr(0, key.indexOf('_'))) + '_' + loan.get(key);
          loan.set('date_' + skey, (new Date()).toISOString());
          loan.set('user_' + skey, loan._curUser);
        }
      }
    });
  },
  setCurUser: function (user) {
    this._curUser = user;
  }
}, {
  fromStringHash: function (hash) {
    Object.keys(schema.properties).forEach(function (key) {
      if (hash[key]) {
        var prop = schema.properties[key];
        if (prop.type === 'integer') {
          hash[key] = Number(hash[key]);
        }
      } else {
        delete hash[key];
      }
    });
    return new Loan(hash);
  }
});

// Necessary for compoundjs compatibility
Loan.modelName = 'Loan';
