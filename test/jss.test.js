'use strict';

var assert = require('assert');
var fs = require('fs');
var url = require('url');
var JSSClient = require('../lib/jss');

/**
 * Test.
 */
describe('test jss', function(){
  var config;
  try {
    config = require('../config.json');
  } catch(err) {
    console.log(err);
    return;
  }
  
  this.timeout(10000);
  var jss = new JSSClient(config);
  
  it('should list buckets', function(done){
    
    jss.listBuckets(function(err, res, data) {
      assert.equal(null, err);
      assert.notEqual(null, data);
      assert.ok(data.Buckets.length > 0);
      assert.equal("books", data.Buckets[0].Name);
      done();
    });
  });
  
  it('should list objects of bucket', function(done){
    
    jss.listObjects('books', function(err, res, data) {
      assert.equal(null, err);
      assert.notEqual(null, data);
      // console.log('res: ', data);
      // pub2me-logo-v3.png
      assert.equal('cat-put.jpg', data.Contents[0].Key);
      done();
    });
  });
  
  it('should not found bucket', function(done){
    
    jss.listObjects('books-not-found', function(err) {
      assert.notEqual(null, err);
      assert.equal('NoSuchBucket', err.code);
      done();
    });
  });
  
  it('should head object of bucket', function(done){
    jss.headObject('books', 'pub2me-logo-v3.png', function(err, res) {
      assert.equal(null, err);
      assert.ok('content-type' in res.headers);
      done();
    });
  });
  
  it('should generate signed url', function(done){
    var signedUrl = jss.signedUrl('GET', 'books', 'cat.jpg');
    var signedUri = url.parse(signedUrl);
    assert.equal('/books/cat.jpg', signedUri.pathname);
    done();
  });
  
  it('should not found object of bucket', function(done){
    // 404 Not Found
    jss.headObject('books', 'object-not-found', function(err) {
      assert.notEqual(null, err);
      // console.log('res: ', err, 'data: ', data);
      assert.equal('HTTP response code 404', err.message);
      done();
    });
  });
  
  // download file
  it('should get object of bucket', function(done){
    var filename = 'pub2me-logo-v3.png';
    jss.getObject('books', filename, function(err, res, data) {
      assert.equal(null, err);
      assert.notEqual(null, data);
      fs.writeFile('/Users/pingjiang/' + filename, data, { encoding: 'binary' }, function(err) {
        if (err) {
          return done(err);
        }
        
        done();
      });
    });
  });
  
  it('should create bucket', function(done){
    jss.putBucket('books-test-test', function(err, res) {
      assert.equal(null, err);
      assert.equal(201, res.statusCode); // 201 Created
      done();
    });
  });
  
  it('should delete bucket', function(done){
    jss.deleteBucket('books-test-test', function(err, res) {
      assert.equal(null, err);
      assert.equal(204, res.statusCode); // 204 No Content
      done();
    });
  });
  
  it('should invalid bucket name', function(done){
    jss.putBucket('.+/', function(err, res) {
      assert.notEqual(null, err);
      assert.equal('InvalidBucketName', err.code);
      assert.equal(400, res.statusCode); // 400 Bad Request
      done();
    });
  });
  
  // upload files into jss
  it('should upload file into bucket', function(done){
    this.timeout(10000);

    var filename = 'clsBtn.gif';
    fs.readFile('/Users/pingjiang/Pictures/' + filename, function(err, data) {
      if (err) {
        console.log(err);
        return done();
      }
      
      // cat.jpg, jss-logo.png, clsBtn.gif
      jss.putObject('books', filename, filename, data, function(err, res) {
        assert.equal(null, err);
        assert.equal(200, res.statusCode);
        done();
      });
    });
  });
  
});

