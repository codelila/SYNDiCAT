/**
 * Copyright 2014 Adrian Lang <mail@adrianlang.de>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

var SentToLoanerState = {
  name: 'sent_to_loaner',
  type: 'contract_state',
  isNext: function (state) {
    return state.contract === null;
  },
  isSet: function (state) {
    return state.contract !== null;
  }
};

var SignatureReceivedState = {
  name: 'signature_received',
  type: 'contract_state',
  isNext: function (state) {
    return state.contract === 'sent_to_loaner';
  },
  isSet: function (state) {
    return [ 'signature_received', 'signature_sent' ].indexOf(state.contract) !== -1;
  }
};

var SignatureSentState = {
  name: 'signature_sent',
  type: 'contract_state',
  isNext: function (state) {
    return state.contract === 'signature_received' && state.loan === 'loaned';
  },
  isSet: function (state) {
    return state.contract === 'signature_sent';
  }
};

var LoanedState = {
  name: 'loaned',
  type: 'loan_state',
  isNext: function (state) {
    return state.loan === null;
  },
  isSet: function (state) {
    return state.loan !== null;
  }
};

module.exports = [ SentToLoanerState, SignatureReceivedState, LoanedState, SignatureSentState ];
