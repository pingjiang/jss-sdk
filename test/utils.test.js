/**
* Module dependencies.
*/

var assert = require('assert');
var utils = require('../lib/utils');

String.prototype.times = function(n) {
  var val = this;
  var buf = '';
  for (var i = 0; i < n; i++) {
    buf += val;
  }
  return buf;
};

function generateString(len) {
  if (len >= 0 && len <= 10) {
    return '0123456789'.substr(0, len);
  }
  
  return generateString(10).times(Math.floor(len/10)) + generateString(len%10);
}
/**
* Test.
*/

describe('test generateString', function(){
  it('should generate correct string', function(done){
    
    assert.equal('', generateString(0));
    assert.equal('0', generateString(1));
    assert.equal('0123456789', generateString(10));
    assert.equal('01234567890', generateString(11));
    
    done();
  });
});

describe('test replaceVars', function(){
  it('should replaceVars', function(done){
    
    assert.equal('/pingjiang', utils.replaceVars('/${name}', { name: 'pingjiang' }));
    assert.equal('/pingjiang/love/pingjiang', utils.replaceVars('/${name}/love/${name}', { name: 'pingjiang' }));
    
    done();
  });
});


describe('test utils', function(){
  it('length should >= 3', function(done){
    
    assert.equal(false, utils.isValidBucketName('0'));
    assert.equal(false, utils.isValidBucketName('00'));
    assert.equal(false, utils.isValidBucketName('-00'));
    assert.equal(false, utils.isValidBucketName('.00'));
    assert.equal(false, utils.isValidBucketName('_00'));
    
    done();
  });
  
  it('can only contains [a-z0-9.-_]', function(done){
    assert.equal(true, utils.isValidBucketName('00a'));
    assert.equal(true, utils.isValidBucketName('aa0'));
    assert.equal(true, utils.isValidBucketName('00a.'));
    assert.equal(true, utils.isValidBucketName('00a.'));
    assert.equal(true, utils.isValidBucketName('00a_'));
    assert.equal(true, utils.isValidBucketName('00a-'));
    
    done();
  });
  
  it('length should <= 255', function(done){
    assert.equal(false, utils.isValidBucketName(generateString(256)));
    
    done();
  });
  
  it('shoule not be IP Address', function(done){
    assert.equal(false, utils.isValidBucketName('1.2.3.4'));
    assert.equal(true, utils.isValidBucketName('1.11.111.1111'));
    
    done();
  });
  
  
  it('shoule not startswith jingdong', function(done){
    assert.equal(false, utils.isValidBucketName('jingdong'));
    assert.equal(false, utils.isValidBucketName('jingdong123'));
    assert.equal(true, utils.isValidBucketName('123jingdong'));
    
    done();
  });
});
