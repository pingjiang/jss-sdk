'use strict';

var assert = require('assert');
var jss = require('../lib/jss');

/**
 * Test.
 */
describe('test jss', function(){
  it('should equal', function(done){
    assert.equal('awesome', jss.awesome());
    done();
  });
});

