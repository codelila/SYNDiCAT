'use strict';

var schema = {
  properties: {
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
    interest_yearly_to: {
      type: 'text',
    },
    rate_of_interest: {
      type: 'number',
      minimum: 0
    },
    loaner_name: { type: 'string' },
    loaner_address: { type: 'string' },
    loaner_phone: { type: 'string' },
    loaner_email: { type: 'string' },
    notes: { type: 'string' },
    contract_state: { type: 'string' },
    loan_state: { type: 'string' },
    date_created: {
      type: 'string',
      format: 'date-time'
    },
    user_created: { type: 'string' },
    date_contract_sent_to_loaner: {
      type: 'string',
      format: 'date-time'
    },
    user_contract_sent_to_loaner: { type: 'string' },
    date_contract_signature_received: {
      type: 'string',
      format: 'date-time'
    },
    user_contract_signature_received: { type: 'string' },
    date_contract_signature_sent: {
      type: 'string',
      format: 'date-time'
    },
    user_contract_signature_sent: { type: 'string' },
    date_loan_loaned: {
      type: 'string',
      format: 'date-time'
    },
    user_loan_loaned: { type: 'string' },
    date_loan_repaid: {
      type: 'string',
      format: 'date-time'
    },
    user_loan_repaid: { type: 'string' },
  },
  required: [
    'value', 'loaner_name', 'loaner_address', 'date_created', 'user_created', 'rate_of_interest'
  ],
  /**
   * (minimum_term && cancelation_period && !granted_until) ||
   * (granted_until && !minimum_term && !cancelation_period)
   */
  anyOf: [
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
};

module.exports = schema;
