'use strict';

var assert = require('assert');
var fs = require('fs');
var JSSClient = require('../lib/jss');

var appKey = '49de4df0e7b54348a2f2b18304f5daff';
var appSecret = '63c44a9c87274e5f8ad2b0577d9c97cd99KbnyPy';
var jss = new JSSClient(appKey, appSecret);

/**
 * Test.
 */
describe('test jss', function(){
  this.timeout(10000);
  
  it('should list buckets', function(done){
    // {"Buckets":[{"Name":"books","CreationDate":"Wed, 30 Jul 2014 03:24:44 GMT","Location":""},{"Name":"test1406738196593","CreationDate":"Wed, 30 Jul 2014 16:36:37 GMT","Location":""}]}
    jss.listBuckets(function(err, res, data) {
      assert.equal(null, err);
      assert.notEqual(null, data);
      // console.log('res: ', err, 'data: ', data);
      assert.ok(data.Buckets.length > 0);
      assert.equal("books", data.Buckets[0].Name);
      done();
    });
  });
  
  it('should list objects of bucket', function(done){
    // {"Name":"books","Prefix":null,"Marker":null,"Delimiter":null,"MaxKeys":1000,"HasNext":false,"Contents":[{"Key":"pub2me-logo-v3.png","LastModified":"Wed, 30 Jul 2014 03:25:04 GMT","ETag":"cff23d5780e3b81fba2e7814354dff55","Size":1760}],"CommonPrefixes":[]}
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
    // {"code":"NoSuchBucket","message":"The specified bucket does not exist.","resource":"/books-not-found","requestId":"81D22FC6523289C3"}
    jss.listObjects('books-not-found', function(err, res, data) {
      assert.notEqual(null, err);
      // console.log('res: ', err, 'data: ', data);
      assert.equal('NoSuchBucket', err.code);
      done();
    });
  });
  
  it('should head object of bucket', function(done){
    jss.headObject('books', 'pub2me-logo-v3.png', function(err, res, data) {
      assert.equal(null, err);
      assert.notEqual(null, data);
      done();
    });
  });
  
  it('should not found object of bucket', function(done){
    // 404 Not Found
    jss.headObject('books', 'object-not-found', function(err, res, data) {
      assert.notEqual(null, err);
      // console.log('res: ', err, 'data: ', data);
      assert.equal('HTTP response code 404', err.message);
      done();
    });
  });
  
  // it('should get object of bucket', function(done){
  //   var filename = 'pub2me-logo-v3.png';
  //   jss.getObject('books', filename, function(err, data) {
  //     assert.equal(null, err);
  //     assert.notEqual(null, data);
  //     fs.writeFile('/Users/pingjiang/' + filename, data, function(err1) {
  //       if (err1) {
  //         return done(err1);
  //       }
  //       
  //       done();
  //     });
  //   });
  // });
  
  it('should create bucket', function(done){
    // 201 Created
    jss.putBucket('books-test-test', function(err, res, data) {
      assert.equal(null, err);
      done();
    });
  });
  
  it('should delete bucket', function(done){
    jss.deleteBucket('books-test-test', function(err, res, data) {
      assert.equal(null, err);
      done();
    });
  });
  
  it('should invalid bucket name', function(done){
    // {"code":"InvalidBucketName","message":"The specified bucket is not valid.","resource":"/.+","requestId":"96793B64BA6D0DEC"}
    jss.putBucket('.+/', function(err, res, data) {
      assert.notEqual(null, err);
      // console.log('res: ', err, 'data: ', data);
      assert.equal('InvalidBucketName', err.code);
      done();
    });
  });
  
  // upload files into jss
  it('should upload file into bucket', function(done){
    this.timeout(10000);
    
    // { code: 'SignatureDoesNotMatch', message: 'The request signature we calculated does not match the signature you provided.', resource: '/books/cat.jpg/cat.jpg', requestId: '80A9F5B2DD9C74C7' }
    // { code: 'RequestTimeout', message: 'Your socket connection to the server was not read from or written to within the timeout period.', resource: '/books/cat.jpg/cat.jpg', requestId: 'A27DA928BFCF1708' }
    // {"code":"RequestTimeout","message":"Your socket connection to the server was not read from or written to within the timeout period.","resource":"/books/cat.jpg/cat.jpg","requestId":"8E42F0479BB7D155"}
    var filename = 'clsBtn.gif';
    fs.readFile('/Users/pingjiang/Pictures/' + filename, function(err, data) {
      if (err) {
        console.log(err);
        return done();
      }
      
      // cat.jpg, jss-logo.png, clsBtn.gif
      jss.putObject('books', filename, filename, data, function(err1, res, data) {
        assert.equal(null, err1);
        // console.log('res: ', err1, 'data: ', data);
        // assert.equal('InvalidBucketName', err.code);
        done();
      });
    })
  });
  
});

