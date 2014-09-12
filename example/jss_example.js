'use strict';

var fs = require('fs');
var JSSClient = require('../lib/jss');
var config = require('../config.json');

var client = new JSSClient(config);

// { code: 'SignatureDoesNotMatch', message: 'The request signature we calculated does not match the signature you provided.', resource: '/books/cat.jpg/cat.jpg', requestId: '80A9F5B2DD9C74C7' }
// { code: 'RequestTimeout', message: 'Your socket connection to the server was not read from or written to within the timeout period.', resource: '/books/cat.jpg/cat.jpg', requestId: 'A27DA928BFCF1708' }
// {"code":"RequestTimeout","message":"Your socket connection to the server was not read from or written to within the timeout period.","resource":"/books/cat.jpg/cat.jpg","requestId":"8E42F0479BB7D155"}

// {"Buckets":[{"Name":"books","CreationDate":"Wed, 30 Jul 2014 03:24:44 GMT","Location":""},{"Name":"test1406738196593","CreationDate":"Wed, 30 Jul 2014 16:36:37 GMT","Location":""}]}
client.listBuckets(function(err, res, data) {
  if (err) {
    throw err;
  }
  
  for (var bucket in data.Buckets) {
    console.log(bucket.Name);
  }
});

// {"code":"InvalidBucketName","message":"The specified bucket is not valid.","resource":"/.+","requestId":"96793B64BA6D0DEC"}
client.putBucket('bucket-test', function(err, res, data) {
  if (err) {
    throw err;
  }
});


client.deleteBucket('bucket-test', function(err, res, data) {
  if (err) {
    throw err;
  }
});

// {"Name":"books","Prefix":null,"Marker":null,"Delimiter":null,"MaxKeys":1000,"HasNext":false,"Contents":[{"Key":"pub2me-logo-v3.png","LastModified":"Wed, 30 Jul 2014 03:25:04 GMT","ETag":"cff23d5780e3b81fba2e7814354dff55","Size":1760}],"CommonPrefixes":[]}
// {"code":"NoSuchBucket","message":"The specified bucket does not exist.","resource":"/books-not-found","requestId":"81D22FC6523289C3"}
client.listObjects('bucket-test', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  for (var obj in data.Contents) {
    console.log(obj.Key);
  }
});


client.headObject('bucket-test', 'test-object-key.jpg', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  for (var header in res.headers) {
    console.log(header);
  }
});


client.getObject('bucket-test', 'test-object-key.jpg', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  fs.writeFile('test-object-key.jpg', data, {
    encoding: 'binary'
  }, function(err) {
    if (err) {
      throw err;
    }
    
    console.log('Write ', data.length, ' bytes sucsess.');
  });
});


fs.readFile('test-object.jpg', function(err, data) {
  if (err) {
    throw err;
  }
  var key = filename = 'test-object-key.jpg';
  client.putObject('bucket-test', key, filename, data, function(err, res, data) {
    if (err) {
      throw err;
    }
  
    console.log('Upload ', key, ' success');
  });
});

client.deleteObject('bucket-test', 'test-object-key.jpg', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  console.log('Delete sucsess.');
});
