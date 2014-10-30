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

var assert = require('assert');

var LoanStates = require('../../core/LoanStates.js');

describe('LoanStates', function () {
  it('has four elements', function () {
    assert.equal(LoanStates.length, 4);
  });
  describe('SentToLoanerState', function () {
    var LoanState = LoanStates[0];
    it('has the correct name', function () {
      assert.equal(LoanState.name, 'sent_to_loaner');
    });
    it('has the correct type', function () {
      assert.equal(LoanState.type, 'contract_state');
    });
    it('knows when it\'s next', function () {
      assert.ok(LoanState.isNext({ contract: null, loan: null }));
    });
    it('knows when it\'s set', function () {
      assert.ok(LoanState.isSet({ contract: 'sent_to_loaner', loan: null }));
    });
  });
  describe('SignatureReceivedState', function () {
    var LoanState = LoanStates[1];
    it('has the correct name', function () {
      assert.equal(LoanState.name, 'signature_received');
    });
    it('has the correct type', function () {
      assert.equal(LoanState.type, 'contract_state');
    });
    it('knows when it\'s next', function () {
      assert.ok(LoanState.isNext({ contract: 'sent_to_loaner', loan: null }));
    });
    it('knows when it\'s set', function () {
      assert.ok(LoanState.isSet({ contract: 'signature_received', loan: null }));
    });
  });
  describe('LoanedState', function () {
    var LoanState = LoanStates[2];
    it('has the correct name', function () {
      assert.equal(LoanState.name, 'loaned');
    });
    it('has the correct type', function () {
      assert.equal(LoanState.type, 'loan_state');
    });
    it('knows when it\'s next', function () {
      assert.ok(LoanState.isNext({ contract: 'signature_received', loan: null }));
    });
    it('knows when it\'s set', function () {
      assert.ok(LoanState.isSet({ contract: 'signature_received', loan: 'loaned' }));
    });
  });
  describe('SignatureSentState', function () {
    var LoanState = LoanStates[3];
    it('has the correct name', function () {
      assert.equal(LoanState.name, 'signature_sent');
    });
    it('has the correct type', function () {
      assert.equal(LoanState.type, 'contract_state');
    });
    it('knows when it\'s next', function () {
      assert.ok(LoanState.isNext({ contract: 'signature_received', loan: 'loaned' }));
    });
    it('knows when it\'s set', function () {
      assert.ok(LoanState.isSet({ contract: 'signature_sent', loan: 'loaned' }));
    });
  });
});
