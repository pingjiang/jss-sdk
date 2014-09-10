/**
 * Module dependencies.
 */

var util = require('util');
var net = require('net');
var crypto = require('crypto');
var url = require('url');
var qs = require('querystring');

var JSS_BUCKET_REGEXP = /^[a-z0-9]{1}[a-z0-9\.\-_]{2,254}$/;

var replaceVars = exports.replaceVars = function(url, args){
	var result = url;
	if (!args) return url;

	for (var placeholder in args){
		var regex = new RegExp("\\$\\{" + placeholder + "\\}","gi");
		result = result.replace(regex, args[placeholder]);
	}
	
	return result;
};

/**
 * Validate JSS bucket name.
 * 文件名只能由字母、数字、下划线('_')、中划线('-')、中文、目录分隔符('/')以及点号('.')组成，  
 * 长度必须在1-100之间， 不能以'/'开头， 不能包含连续的'/'(如"//")， 
 * 网页端上传文件大小限制为64MB， 目前还不支持文件替换。
 *
 * @param  {String} bucketName
 * @api private
 */
exports.isValidBucketName = function (bucketName) {
  if (net.isIP(bucketName)) {
    return false;
  }
  if (bucketName.indexOf('jingdong') === 0) {
    return false;
  }
  if (!JSS_BUCKET_REGEXP.test(bucketName)) {
    return false;
  }
  
  return true;
}

exports.guessContentTypeByExtension = function (ext) {
  return null;
}

/**
 * compress
 * x-jingdong-meta-row: abc, x-jingdong-meta-row: bcd
 * to
 * x-jingdong-meta-row:abc,bcd  // value have no lead space
 */
var canonicalizeHeader = exports.canonicalizeHeader = function(header) {
  var parts = header.split(',');
  var items = {};
  for (var i in parts) {
    var part = parts[i].trim();
    var pos = part.indexOf(':');
    if (pos != -1) {
      var key = part.substr(0, pos).trim();
      var value = part.substr(pos + 1).trim();
      if (items[key]) {
        items[key].push(value);
      } else {
        items[key] = [value];
      }
    }
  }
  var ret = '';
  for (var key in items) {
    ret += (key + ':' + items[key].join(',') + '\n');
  }
  
  return ret;
};

// "x-jingdong"
var signHeaderMetas = function(headers, headerPrefix) {
  var keys = [];
  var lowered = headerPrefix.toLowerCase();
  for (var key in headers) {
    if (key.toLowerCase().indexOf(lowered) === 0) {
      keys.push(key);
    }
  }
  keys.sort();
  var ret = '';
  for (var i in keys) {
    var key = keys[i];
    // TODO headers[key].join(',')
    ret += (key + ':' + headers[key] + '\n');
  }
  return ret;
};

var jdSign = function(method, path, headers, appKey, appSecret) {
  var contentType = headers['Content-Type'] || headers['content-type'];
  var contentMD5 = headers['Content-MD5'] || headers['content-md5'];
  var dateGMT = headers['Date'];
  
  var metaSigned = signHeaderMetas(headers, 'x-jingdong');
  
  var signStr = util.format('%s\n%s\n%s\n%s\n%s%s', method, contentMD5, contentType, dateGMT, metaSigned, path);
  
  var hmac = crypto.createHmac('sha1', appSecret);
  hmac.update(signStr);
  var signed = hmac.digest('base64');
  var auth = 'jingdong' + ' ' + appKey + ':' + signed;
  
  return auth;
};

var contentMD5 = exports.contentMD5 = function(data) {
  var md5 = crypto.createHash('md5');
  md5.update(data);
  return md5.digest('hex');
};

/**
 * metaSigned: x-jingdong Headers
 * signStr: '{method}\n{contentMD5}\n{contentType}\n{date}\n{metaSigned}{path}'
 * Authorization: base64(hash_hmac('sha1', signStr, appSecret))
 */
var setAuthHeader = exports.setAuthHeader = function (method, path, headers, appKey, appSecret) {
  var dateNow = new Date().toGMTString(); // Mon, 18 Dec 1995 17:28:35 GMT
  headers['Date'] = dateNow;
  headers['Authorization'] = jdSign(method, path, headers, appKey, appSecret);
  headers['Expect'] = '';
  return headers;
};

// expire=300
exports.preSignedHeaders = function(method, path, headers, expire, appKey, appSecret) {
  var dateNow = new Date();
  var expireDate = dateNow + new Date(expire);
  
  headers['Date'] = dateNow.toGMTString();
  headers['Expires'] = expireDate.toGMTString();
  headers['Signature'] = jdSign(method, path, headers, appKey, appSecret);
  headers['AccessKey'] = appKey;
  
  return headers;
};


var buildURL = exports.buildURL = function (baseURL, path, params) {
  return url.format(baseURL, path, params);
};
