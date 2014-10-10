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
var Promise = require('es6-promise').Promise;
var sinon = require('sinon');

var ContractGenerator = require('../../core/ContractGenerator.js');

describe('ContractGenerator', function () {
  it('is constructable', function () {
    var contractGenerator = new ContractGenerator();

    assert.ok(contractGenerator instanceof ContractGenerator);
  });

  describe('render', function () {
    function makeRenderData (value) {
      value = value || {};
      value.loaner_address = value.loaner_address || '';
      value.value = value.value || 1;
      return value;
    }

    it('calls PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(makeRenderData()).then(function () {
        assert.ok(renderPdf.calledOnce);
        done();
      }).catch(done);
    });

    it('passes debtor to PDF renderer', function (done) {
      var debtor = {};
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });

      var contractGenerator = new ContractGenerator(renderPdf, debtor);

      contractGenerator.render(makeRenderData()).then(function () {
        assert.ok(renderPdf.calledWith(sinon.match({
          debtor: debtor
        })));
        done();
      }).catch(done);
    });

    it('computes loaner info and passes it to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        loaner_name: 'Name',
        loaner_address: 'There\nThis\nThat'
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          loaner: sinon.match({
            name: 'Name',
            address: 'There\\\\This\\\\That'
          })
        }));
        done();
      }).catch(done);
    });

    it('passes formatted granted until to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        granted_until: '1970-01-02',
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            grantedUntil: '2. Januar 1970',
          })
        }));
        done();
      }).catch(done);
    });

    it('passes empty granted until to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        granted_until: ''
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            grantedUntil: null,
          })
        }));
        done();
      }).catch(done);
    });

    it('passes contract id to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        id: 5
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            nr: 5
          })
        }));
        done();
      }).catch(done);
    });

    it('passes value to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        value: 1000
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            value: 1000
          })
        }));
        done();
      }).catch(done);
    });

    it('passes value in words to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        value: 1000
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            valueInWords: 'eintausend'
          })
        }));
        done();
      }).catch(done);
    });

    it('passes interest to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        rate_of_interest: 1
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            interest: 1
          })
        }));
        done();
      }).catch(done);
    });

    it('passes minimum term to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        minimum_term: 1
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            minimumTerm: 1
          })
        }));
        done();
      }).catch(done);
    });

    it('passes cancelation period to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        cancelation_period: 1
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            cancelationPeriod: 1
          })
        }));
        done();
      }).catch(done);
    });

    it('passes yearly interest to to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        interest_yearly_to: 'Here\nThat\nThere'
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            yearlyInterestTo: 'Here\\\\That\\\\There'
          })
        }));
        done();
      }).catch(done);
    });

    it('passes empty yearly interest to to PDF renderer', function (done) {
      var renderPdf = sinon.spy(function () { return Promise.resolve(); });
      var input = makeRenderData({
        interest_to_yearly: ''
      });

      var contractGenerator = new ContractGenerator(renderPdf);

      contractGenerator.render(input).then(function () {
        sinon.assert.calledWith(renderPdf, sinon.match({
          contract: sinon.match({
            yearlyInterestTo: ''
          })
        }));
        done();
      }).catch(done);
    });
  });
});
