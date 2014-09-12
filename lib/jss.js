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
    this._aws = opts
    return this
  }
  var date = new Date()
  this.setHeader('date', date.toGMTString())
  var auth =
    { key: opts.key
    , secret: opts.secret
    , verb: this.method.toUpperCase()
    , date: date
    , contentType: this.getHeader('Content-Type') || ''
    , md5: this.getHeader('Content-MD5') || ''
    , jssHeaders: jssSign.canonicalizeHeaders(this.headers)
    }
  var path = this.uri.path;
  auth.resource = path;
  auth.resource = jssSign.canonicalizeResource(auth.resource)
  this.setHeader('authorization', jssSign.authorization(auth))

  return this
};


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
            vendorType = vendors.length
              ? type + '/vnd.' + vendors.join('.') + '+' + subtype
              : vendorType = type + '/' + subtype;
          }
          contentParser = parsers.auto.matchers[vendorType];
        }
      }
    }
    if (typeof contentParser == 'function') {
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

function JSSClient(appKey, appSecret, defaults) {
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

JSSClient.prototype.doRequest = function(method, path, options, next) {
  var self = this;
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
          return next(parsedData);
        }
        return next(new Error('HTTP response code ' + res.statusCode));
      }
      
      next(err, res, parsedData);
    });
  });
};

JSSClient.prototype.listBuckets = function(next) {
  var reqPath = '/';
  return this.doRequest('GET', reqPath, null, next);
};

JSSClient.prototype.putBucket = function(bucket, next) {
  var reqPath = path.join('/', bucket);
  return this.doRequest('PUT', reqPath, null, next);
};

JSSClient.prototype.deleteBucket = function(bucket, next) {
  var reqPath = path.join('/', bucket);
  return this.doRequest('DELETE', reqPath, null, next);
};

JSSClient.prototype.listObjects = function(bucket, next) {
  var reqPath = path.join('/', bucket);
  return this.doRequest('GET', reqPath, null, next);
};

JSSClient.prototype.headObject = function(bucket, key, next) {
  var reqPath = path.join('/', bucket, key);
  return this.doRequest('HEAD', reqPath, null, next);
};

JSSClient.prototype.getObject = function(bucket, key, next) {
  var reqPath = path.join('/', bucket, key);
  return this.doRequest('GET', reqPath, {
    encoding: null
  }, next);
};

JSSClient.prototype.putObject = function(bucket, key, filename, data, next) {
  var reqPath = path.join('/', bucket, key || filename);
  return this.doRequest('PUT', reqPath, {
    headers: {
      'Content-Type': utils.guessContentType(filename),
      'Content-MD5': utils.contentMD5(data)
    },
    body: data
  }, next);
};

JSSClient.prototype.deleteObject = function(bucket, key, next) {
  var reqPath = path.join('/', bucket, key);
  return this.doRequest('DELETE', reqPath, null, next);
};


module.exports = JSSClient;
