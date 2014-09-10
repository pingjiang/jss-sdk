/**
 * Module dependencies.
 */

var assert = require('assert');
var signer = require('../lib/signer');

var appKey = '49de4df0e7b54348a2f2b18304f5daff';
var appSecret = '63c44a9c87274e5f8ad2b0577d9c97cd99KbnyPy';


/**
 * Test.
 */

describe('test signer', function(){
  
  it('should same as Java', function(done){
    auth = signer.sign('GET', '/', {}, { 
      'Date': 'Wed, 30 Jul 2014 15:32:14 GMT'
    }, appKey, appSecret);
    
    assert.equal('jingdong 49de4df0e7b54348a2f2b18304f5daff:ors0T7CjUxkGqNPR+l9VlCa2KGE=', auth);
    
    done();
  });
  
  it('should same as Java new', function(done){
    auth = signer.sign('GET', '/', {}, { 
      'Date': 'Wed, 10 Sep 2014 07:51:30 GMT'
    }, appKey, appSecret);
    
    assert.equal('jingdong 49de4df0e7b54348a2f2b18304f5daff:kz2n2bEJpzHulkjuhsfEclSSr+w=', auth);
    
    done();
  });
  
});


/*

GET / HTTP/1.1
Date: Wed, 10 Sep 2014 07:51:30 GMT
Authorization: jingdong 49de4df0e7b54348a2f2b18304f5daff:kz2n2bEJpzHulkjuhsfEclSSr+w=
Host: storage.jcloud.com
Connection: Keep-Alive
User-Agent: JSS-SDK-JAVA/1.2.0 (Java 1.7.0_55; Vendor Oracle Corporation; Mac OS X 10.9.3; HttpClient 4.2.1)

HTTP/1.1 200 OK
x-jss-request-id: A18D02A2711A577D
Server: JSS/1.2
Content-Type: application/json;charset=UTF-8
Content-Length: 181
Date: Wed, 10 Sep 2014 07:51:29 GMT
Connection: close



*/