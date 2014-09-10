var qs = require('querystring');
var crypto = require('crypto');

function getObjectKeys(obj) {
  var ks = [];
  for (var key in obj) {
    ks.push(key);
  }
  return ks;
};

function isArrayContains(items, item) {
  for (var i in items) {
    var v = items[i];
    if (v === item) {
      return true;
    }
  }
  
  return false;
};

function getJssHeaders(headers) {
  var ks = getObjectKeys(headers);
  ks.sort();
  
  var lines = [];
  
  for (var i in ks) {
    var key = ks[i];
    var lowered = key.toLowerCase();
    
    if (lowered.indexOf('x-jss-') === 0) {
      lines.push(lowered + ':' + headers[key]);
    }
  }
  
  return lines.join('\n');
}

function getResource(path, params) {
  var uriPath = (path && path.length > 0) ? path : '/';
  var sub = qs.stringify(getSubResourceAndParameters(params));
  if (sub && sub.length > 0) {
    return uriPath + '?' + sub;
  }
  
  return uriPath;
}

function getSubResourceAndParameters(params) {
  var ret = getSubResources(params);
  var ret1 = getResponseOverridingParameters(params);
  for (var key in ret1) {
    ret[key] = ret1[key];
  }
  return ret;
}


// "contentType", "contentLanguage", "cacheControl", "contentDisposition", "contentEncoding"
function getSubResources(params) {
  var SUB_RESOURCES = ["lifecycle", "location", "logging", "partNumber", 
    "policy", "uploadId", "uploads", "versionId", "versioning", 
    "versions", "website", "acl"];
    
  // filter
  var ret = {};
  for (var key in params) {
    if (isArrayContains(SUB_RESOURCES, key)) {
      ret[key] = params[key];
    }
  }
  
  return ret;
}

// 
function getResponseOverridingParameters(params) {
  var RESPONSE_RESOURCES = ["contentType", "contentLanguage", "cacheControl", "contentDisposition", "contentEncoding"];
    
  // filter
  var ret = {};
  for (var key in params) {
    if (isArrayContains(RESPONSE_RESOURCES, key)) {
      var val = params[key];
      if (val) {
        ret[key] = val;
      }
    }
  }
  
  return ret;
}


var signForAuth = function(data, appKey, appSecret) {
  var hmac = crypto.createHmac('sha1', appSecret);
  hmac.update(data);
  var signed = hmac.digest('base64');
  var auth = 'jingdong ' + appKey + ':' + signed;
  
  return auth;
};

var sign = module.exports.sign = function(method, path, params, headers, key, secret) {
  var contentMD5 = headers['Content-MD5'] || '';
  var contentType = headers['Content-Type'] || '';
  
  var dateNow = new Date().toGMTString(); // Mon, 18 Dec 1995 17:28:35 GMT
  headers['Date'] = headers['Date'] || dateNow;
  var date = params['Expires'] || headers['Date'];
  
  var parts = [method, contentMD5, contentType, date];
  var customHeader = getJssHeaders(headers);
  if (customHeader && customHeader.length > 0) {
    parts.push(customHeader);
  }
  var sub = getResource(path, params);
  parts.push(sub);
  
  var summary = parts.join('\n');
  
  var auth = signForAuth(summary, key, secret);
  headers['Authorization'] = auth;
  // headers['Expect'] = '';
  
  return auth;
};