/*
 * jss-sdk
 * https://github.com/pingjiang/jss-sdk
 *
 * Copyright (c) 2014 pingjiang
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var rest = require('restler');
var signer = require('./signer');
var utils = require('./utils');

// patch restler auth
rest.Request.prototype._oldApplyAuth = rest.Request.prototype._applyAuth;
rest.Request.prototype._applyAuth = function() {
  if (this.options.appKey && this.options.appSecret !== undefined) {
    // this.headers['Authorization'] = already setted in signer#sign
    signer.sign(this.options.method, 
      this.url.pathname, 
      this.url.query || {}, 
      this.headers, 
      this.options.appKey, 
      this.options.appSecret);
  } else {
    this._oldApplyAuth();
  }
};

rest.Service.prototype.head = function(path, options) {
  return rest.head(this._url(path), this._withDefaults(options));
};

rest.Request.prototype._oldMakeRequest = rest.Request.prototype._makeRequest;
rest.Request.prototype._makeRequest = function() {
  // re-sign with Content-Type and Content-MD5
  // console.log('req: ', this.request, 'headers ', this.request.headers);
  if (this.options.multipart && this.options.data) {
    var contentMD5 = utils.contentMD5(this.options.data.data);
    this.headers['Content-MD5'] = contentMD5;
    this._applyAuth();
    
    this.request.setHeader('Content-MD5', this.headers['Content-MD5']);
    this.request.setHeader('Date', this.headers['Date']);
    this.request.setHeader('Authorization', this.headers['Authorization']);
  }
  
  return this._oldMakeRequest();
};

// Jingdong client
var doRequest = function(m, reqPath, next) {
  return m.call(reqPath).on('timeout', function(ms){
    return next(new Error('did not return within ' + ms + ' ms'));
  }).on('complete', function(result) {
    if (result instanceof Error) {
      return next(result);
    }
    
    return next(null, result);
  });
};

var JSSClient = rest.service(function(appKey, appSecret) {
  this.defaults.appKey = appKey;
  this.defaults.appSecret = appSecret;
}, {
  baseURL: 'http://storage.jcloud.com'
}, {
  listBuckets: function(next) {
    var reqPath = '/';
    return this.get(reqPath).on('complete', function(result, res) {
      if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
        return next(result ? result : new Error('HTTP response code ' + res.statusCode));
      }
    
      return next(null, result);
    });
  },
  putBucket: function(bucket, next) {
    var reqPath = path.join('/', bucket);
    return this.put(reqPath).on('complete', function(result, res) {
      if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
        return next(result ? result : new Error('HTTP response code ' + res.statusCode));
      }
    
      return next(null, result);
    });
  },
  deleteBucket: function(bucket, next) {
    var reqPath = path.join('/', bucket);
    return this.del(reqPath).on('complete', function(result, res) {
      if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
        return next(result ? result : new Error('HTTP response code ' + res.statusCode));
      }
    
      return next(null, result);
    });
  },
  listObjects: function(bucket, next) {
    var reqPath = path.join('/', bucket);
    return this.get(reqPath).on('complete', function(result, res) {
      if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
        return next(result ? result : new Error('HTTP response code ' + res.statusCode));
      }
    
      return next(null, result);
    });
  },
  headObject: function(bucket, key, next) {
    var reqPath = path.join('/', bucket, key);
    return this.head(reqPath).on('complete', function(result, res) {
      if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
        return next(result ? result : new Error('HTTP response code ' + res.statusCode));
      }
    
      return next(null, result);
    });
  },
  initUpload: function(bucket, key, next) {
    var reqPath = path.join('/', bucket, key + '?upload');
    return this.post(reqPath).on('complete', function(result, res) {
        if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
          return next(result ? result : new Error('HTTP response code ' + res.statusCode));
        }
      
        return next(null, result);
    });
  },
  uploadPart: function(bucket, key, uploadId, seekTo, len, next) {
    var reqPath = path.join('/', bucket, key + '?partNumber=&uploadId=');
    return this.put(reqPath).on('complete', function(result, res) {
        if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
          return next(result ? result : new Error('HTTP response code ' + res.statusCode));
        }
      
        return next(null, result);
    });
  },
  listParts: function(bucket, key, uploadId, next) {
    var reqPath = path.join('/', bucket, key + '?uploadId=' + uploadId);
    return this.get(reqPath).on('complete', function(result, res) {
        if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
          return next(result ? result : new Error('HTTP response code ' + res.statusCode));
        }
      
        return next(null, result);
    });
  },
  completeUplaod: function(bucket, key, uploadId, parts, next) {
    var reqPath = path.join('/', bucket, key + '?uploadId='+uploadId);
    return this.post(reqPath).on('complete', function(result, res) {
        if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
          return next(result ? result : new Error('HTTP response code ' + res.statusCode));
        }
      
        return next(null, result);
    });
  },
  putObject: function(bucket, key, filename, data, next) {
    var reqPath = path.join('/', bucket, key);
    return this.put(reqPath, {
        multipart: true,
        data: rest.data(filename, null, data) 
      }).on('complete', function(result, res) {
        if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
          return next(result ? result : new Error('HTTP response code ' + res.statusCode));
        }
      
        return next(null, result);
    });
  },
  deleteObject: function(bucket, key, next) {
    var reqPath = path.join('/', bucket, key);
    return this.del(reqPath).on('complete', function(result, res) {
      if (result instanceof Error || result.code !== undefined || parseInt(res.statusCode) >= 400) {
        return next(result ? result : new Error('HTTP response code ' + res.statusCode));
      }
    
      return next(null, result);
    });
  }
});

module.exports = JSSClient;
