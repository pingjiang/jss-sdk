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
    delete defaults.appKey;
    delete defaults.appSecret;
  }
  
  this.defaults = extend({
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
 * 获取Buckets列表
 *
 * @param  {Object} options
 * @param  {Function} next
 * @api public
 */
JSSClient.prototype.listBuckets = function(options, next) {
  var reqPath = '/';
  return this.doRequest('GET', reqPath, options, next);
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
  var reqPath = path.join('/', bucket);
  return this.doRequest('PUT', reqPath, options, next);
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
  var reqPath = path.join('/', bucket);
  return this.doRequest('DELETE', reqPath, options, next);
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
  var reqPath = path.join('/', bucket);
  return this.doRequest('GET', reqPath, options, next);
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
  var reqPath = path.join('/', bucket, key);
  return this.doRequest('HEAD', reqPath, options, next);
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
  var reqPath = path.join('/', bucket, key);
  if (typeof options === 'function') {
    next = options;
    options = {};
  }
  var opts = extend({
    encoding: null
  }, options);
  return this.doRequest('GET', reqPath, opts, next);
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
  var reqPath = path.join('/', bucket, key || filename);
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
  return this.doRequest('PUT', reqPath, opts, next);
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
  var reqPath = path.join('/', bucket, key);
  return this.doRequest('DELETE', reqPath, options, next);
};


module.exports = JSSClient;
