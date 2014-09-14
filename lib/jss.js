/*
 * jss-sdk
 * https://github.com/pingjiang/jss-sdk
 *
 * Copyright (c) 2014 pingjiang
 * Licensed under the MIT license.
 */

'use strict';

var extend = require('util')._extend;
var path = require('path');
var fs = require('fs');
var utils = require('./utils');
var url = require('url');
var jssSign = require('jss-sign');
var request = require('request');

// patch request aws
request.Request.prototype._oldAWS = request.Request.prototype.aws;
request.Request.prototype.aws = function (opts, now) {
  if (!now) {
    this._aws = opts;
    return this;
  }
  var date = new Date();
  this.setHeader('date', date.toGMTString());
  var auth = {
    key: opts.key,
    secret: opts.secret,
    verb: this.method.toUpperCase(),
    date: date,
    contentType: this.getHeader('Content-Type') || '',
    md5: this.getHeader('Content-MD5') || '',
    jssHeaders: jssSign.canonicalizeHeaders(this.headers)
  };

  var path = this.uri.path;
  auth.resource = path;
  auth.resource = jssSign.canonicalizeResource(auth.resource);
  this.setHeader('authorization', jssSign.authorization(auth));

  return this;
};

// stolen from @danwrong
var parsers = {
  auto: function(res, data, callback) {
    var contentType = res.headers['content-type'];
    var contentParser;
    if (contentType) {
      contentType = contentType.replace(/;.+/, ''); // remove all except mime type (eg. text/html; charset=UTF-8)
      if (contentType in parsers.auto.matchers) {
        contentParser = parsers.auto.matchers[contentType];
      } else {
        // custom (vendor) mime types
        var parts = contentType.match(/^([\w-]+)\/vnd((?:\.(?:[\w-]+))+)\+([\w-]+)$/i);
        if (parts) {
          var type = parts[1];
          var vendors = parts[2].substr(1).split('.');
          var subtype = parts[3];
          var vendorType;
          while (vendors.pop() && !(vendorType in parsers.auto.matchers)) {
            vendorType = vendors.length ? type + '/vnd.' + vendors.join('.') + '+' + subtype
              : vendorType = type + '/' + subtype;
          }
          contentParser = parsers.auto.matchers[vendorType];
        }
      }
    }
    if (typeof contentParser === 'function') {
      contentParser.call(this, res, data, callback);
    } else {
      callback(null, data);
    }
  },
  json: function(res, data, callback) {
    if (data && data.length) {
      var parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (err) {
        err.message = 'Failed to parse JSON body: ' + err.message;
        callback(err, null);
      }
      if (parsedData !== undefined) {
        callback(null, parsedData);
      }
    } else {
      callback(null, null);
    }
  }
};

parsers.auto.matchers = {
  'application/json': parsers.json
};

/**
 * JSSClient for JSS
 * 
 * 1. pass appKey and appSecret.
 *
 *   var client = new JSSClient('your appkey', 'your appSecret');
 * 
 * 2. pass optional defaults of Request.
 *
 *   var client = new JSSClient('your appKey', 'your appSecret', { followRedirect: true });
 * 
 * 3. pass defaults with appKey and appSecret.
 *
 *   var client = new JSSClient({ appKey: 'your appKey', appSecret: 'your appSecret' });
 *
 * @param  {String} appKey
 * @param  {String} appSecret
 * @param  {Object} defaults
 * @api public
 */
function JSSClient(appKey, appSecret, defaults) {
  if (typeof appKey === 'object') {
    defaults = appKey;
    appKey = defaults.appKey;
    appSecret = defaults.appSecret;
  } else {
    defaults = defaults || {};
    defaults.appKey = appKey;
    defaults.appSecret = appSecret;
  }
  
  this.defaults = extend({
    partSize: 2*1024*1024,// 2MB
    followRedirect: true,
    aws: {
      key: appKey,
      secret: appSecret
    }
  }, defaults);
  this.baseURL = this.defaults.baseURL || 'http://storage.jcloud.com';
  
  this.requestor = request.defaults(this.defaults);
  this.parser = parsers.auto;
}

/**
 * 发送请求
 *
 * @param  {String} method
 * @param  {String} path
 * @param  {Object} options
 * @param  {Function} next
 * @api private
 */
JSSClient.prototype.doRequest = function(method, path, options, next) {
  var self = this;
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  
  var opts = extend({
    method: method,
    uri: url.resolve(self.baseURL, path)
  }, options);
  
  self.requestor(opts, function(err, res, data) {
    if (err) {
      return next(err);
    }
    
    self.parser(res, data, function(err, parsedData) {
      if (res.statusCode >= 400) {
        if (parsedData && parsedData.code) {
          return next(parsedData, res);
        }
        return next(new Error('HTTP response code ' + res.statusCode), res);
      }
      
      next(err, res, parsedData);
    });
  });
};

/**
 * 将请求的响应pipe到stream.Writable流
 *
 * @param  {String} method
 * @param  {String} path
 * @param  {Object} options 可选
 * @param  {Writable} outStream
 * @api private
 */
JSSClient.prototype.pipe = function(method, path, options, outStream) {
  var self = this;
  if (options && options.writable === true) {
    outStream = options;
    options = {};
  }
  
  var opts = extend({
    method: method,
    uri: url.resolve(self.baseURL, path)
  }, options);
  self.requestor(opts).pipe(outStream);
};

/**
 * 生成签名的外链
 *
 * @param  {String} method
 * @param  {String} bucket
 * @param  {String} key
 * @param  {Object} headers
 * @param  {Number} startTime
 * @param  {Number} expires
 * @api private
 */
JSSClient.prototype.signedUrl = function(method, bucket, key, headers, startDate, expires) {
  var pathname = path.join('/', bucket, key);
  headers = headers || {};
  expires = expires || 300; // 5min
  startDate = startDate || new Date();
  headers['Date'] = Math.floor(startDate.getTime()/1000) + expires;
  
  var auth = {
    key: this.defaults.appKey,
    secret: this.defaults.appSecret,
    verb: method || 'GET',
    date: headers['Date'],
    contentType: headers['Content-Type'] || '',
    md5: headers['Content-MD5'] || '',
    jssHeaders: jssSign.canonicalizeHeaders(headers)
  };

  auth.resource = pathname;
  auth.resource = jssSign.canonicalizeResource(auth.resource);
  headers['Authorization'] = jssSign.sign(auth);// signQuery only support GET
  
  var params = {
    Expires: headers['Date'],
    AccessKey: this.defaults.appKey,
    Signature: headers['Authorization']
  };
  
  return url.resolve(this.baseURL, url.format({
    pathname: pathname,
    query: params
  }));
};

/**
 * 获取Buckets列表
 *
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.listBuckets = function(options, next) {
  var pathname = '/';
  return this.doRequest('GET', pathname, options, next);
};

/**
 * 创建Bucket
 *
 * @param  {String} bucket 必须符合Bucket命名规范
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.putBucket = function(bucket, options, next) {
  var pathname = path.join('/', bucket);
  return this.doRequest('PUT', pathname, options, next);
};

/**
 * 删除Bucket
 *
 * @param  {String} bucket
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.deleteBucket = function(bucket, options, next) {
  var pathname = path.join('/', bucket);
  return this.doRequest('DELETE', pathname, options, next);
};

/**
 * 列出Bucket中所有Objects
 *
 * @param  {String} bucket
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.listObjects = function(bucket, options, next) {
  var pathname = path.join('/', bucket);
  return this.doRequest('GET', pathname, options, next);
};

/**
 * 获取Object基本信息
 *
 * @param  {String} bucket
 * @param  {String} key
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.headObject = function(bucket, key, options, next) {
  var pathname = path.join('/', bucket, key);
  return this.doRequest('HEAD', pathname, options, next);
};

/**
 * 获取Object内容
 *
 * @param  {String} bucket
 * @param  {String} key
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.getObject = function(bucket, key, options, next) {
  var pathname = path.join('/', bucket, key);
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  var opts = extend({
    encoding: null
  }, options);
  return this.doRequest('GET', pathname, opts, next);
};

/**
 * 获取Object内容pipe到stream.Writable
 *
 * @param  {String} bucket
 * @param  {String} key
 * @param  {Object} options
 * @param  {Writable} outStream
 * @api public
 */
JSSClient.prototype.pipeObject = function(bucket, key, options, outStream) {
  var pathname = path.join('/', bucket, key);
  if (options && options.writable === true) {
    outStream = options;
    options = {};
  }
  var opts = extend({
    encoding: null
  }, options);
  return this.pipe('GET', pathname, opts, outStream);
};

/**
 * 上传Object
 *
 * @param  {String} bucket
 * @param  {String} key
 * @param  {String} filename
 * @param  {Buffer} data
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.putObject = function(bucket, key, filename, data, options, next) {
  var pathname = path.join('/', bucket, key || filename);
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  var opts = extend({
    headers: {
      'Content-Type': utils.guessContentType(filename),
      'Content-MD5': utils.contentMD5(data)
    },
    body: data
  }, options);
  return this.doRequest('PUT', pathname, opts, next);
};

/**
 * 删除Object
 *
 * @param  {String} bucket
 * @param  {String} key
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.deleteObject = function(bucket, key, options, next) {
  var pathname = path.join('/', bucket, key);
  return this.doRequest('DELETE', pathname, options, next);
};

/**
 * 实现Multiple上传Object
 *
 * @param  {String} bucket
 * @param  {String} key
 * @param  {String} filepath
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.uploadObject = function(bucket, key, filepath, options, next) {
  var self = this;
  var filename = path.basename(filepath);
  var pathname = path.join('/', bucket, key || filename);
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  self._initUpload(pathname, function(err, res, data) {
    if (err) {
      return next(err, res);
    }

    var uploadId = data.UploadId, results = {}, i = 0, parts = -1, finished = 0;
    var stream = fs.createReadStream(filepath, {
      highWaterMark: self.defaults.partSize || options.partSize
    });
  
    stream.on('data', function(chunk) {
      ++i;
      self._uploadPart(pathname, uploadId, chunk, function(err, res) {
        if (err) {
          results[i] = { err: err };
        } else {
          var etag = res.headers['etag'];
          etag = etag.replace(/^"|"$/g, '');
          results[i] = { err: null, etag: etag };
        }
        ++finished;
        if (parts > 0 && finished === parts) {
          self._completeUpload(pathname, uploadId, results, options, next);
        }
      });
    });
  
    stream.on('end', function() {
      parts = i;
    });
  
    stream.on('error', function(err) {
      next(err, stream);
    });
  });
};

JSSClient.prototype._initUpload = function(pathname, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  return this.doRequest('POST', pathname + '?uploads', options, next);
};

JSSClient.prototype._uploadPart = function(pathname, uploadId, data, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  var opts = extend({
    qs: {
      uploadId: uploadId
    },
    body: data
  }, options);  
  return this.doRequest('PUT', pathname, opts, next);
};

JSSClient.prototype._completeUpload = function(pathname, uploadId, results, options, next) {
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  var jsonResult = { Part: [] };
  for (var key in results) {
    var val = results[key];
    if (val.err) {
      continue;
    }
    
    jsonResult.Part.push({ PartNumber: key, ETag: val.etag });
  }
  
  var opts = extend({
    qs: {
      uploadId: uploadId
    },
    json: jsonResult
  }, options);  
  return this.doRequest('POST', pathname, opts, next);
};

module.exports = JSSClient;
