'use strict';

var assert = require('assert');
var jss = require('../lib/jss');

var appKey = '49de4df0e7b54348a2f2b18304f5daff';
var appSecret = '63c44a9c87274e5f8ad2b0577d9c97cd99KbnyPy';


/**
 * Test.
 */
describe('test jss', function(){
  it('should equal', function(done){
    assert.equal('awesome', jss.awesome());
    done();
  });
});

