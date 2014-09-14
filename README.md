# 京东云存储-NodeJS SDK (jss-sdk) [![Build Status](https://secure.travis-ci.org/pingjiang/jss-sdk.png?branch=master)](http://travis-ci.org/pingjiang/jss-sdk)

京东云存储的一些基本概念请参考[wiki](https://github.com/pingjiang/jss-sdk/wiki)。

京东云存储控制台：[http://man.jcloud.com/appengine/jae/console/addons/jss](http://man.jcloud.com/appengine/jae/console/addons/jss)。


## 快速入门

### 使用`npm`安装依赖：

```sh
$ npm install jss-sdk --save
```

### 安装命令行工具：

```sh
$ npm install -g jss-sdk
$ jss --help
$ jss --version
```

### 创建`JSSClient`：

```js
var JSSClient = require('jss-sdk');

// pass appKey and appSecret.
var client = new JSSClient('your appkey', 'your appSecret');

// pass optional defaults of Request.
var client = new JSSClient('your appKey', 'your appSecret', { followRedirect: true });

// pass defaults with appKey and appSecret.
var client = new JSSClient({ appKey: 'your appKey', appSecret: 'your appSecret' });
```

### request(options, callback)

这一部分绝大多数内容和`Request`一样，增加了一下几个参数：

* `baseURL` JSS提供的服务地址，默认为http://storage.jcloud.com。
* `appKey` JSS提供的appKey。
* `appSecret` JSS提供的appSecret。
* `partSize` Stream读取块大小，也是上传文件的块大小。

The first argument can be either a `url` or an `options` object. The only required option is `uri`; all others are optional.

* `uri` || `url` - fully qualified uri or a parsed url object from `url.parse()`
* `qs` - object containing querystring values to be appended to the `uri`
* `method` - http method (default: `"GET"`)
* `headers` - http headers (default: `{}`)
* `body` - entity body for PATCH, POST and PUT requests. Must be a `Buffer` or `String`.
* `form` - when passed an object or a querystring, this sets `body` to a querystring representation of value, and adds `Content-type: application/x-www-form-urlencoded; charset=utf-8` header. When passed no options, a `FormData` instance is returned (and is piped to request).
* `auth` - A hash containing values `user` || `username`, `pass` || `password`, and `sendImmediately` (optional).  See documentation above.
* `json` - sets `body` but to JSON representation of value and adds `Content-type: application/json` header.  Additionally, parses the response body as JSON.
* `multipart` - (experimental) array of objects which contains their own headers and `body` attribute. Sends `multipart/related` request. See example below.
* `followRedirect` - follow HTTP 3xx responses as redirects (default: `true`). This property can also be implemented as function which gets `response` object as a single argument and should return `true` if redirects should continue or `false` otherwise.
* `followAllRedirects` - follow non-GET HTTP 3xx responses as redirects (default: `false`)
* `maxRedirects` - the maximum number of redirects to follow (default: `10`)
* `encoding` - Encoding to be used on `setEncoding` of response data. If `null`, the `body` is returned as a `Buffer`.
* `pool` - A hash object containing the agents for these requests. If omitted, the request will use the global pool (which is set to node's default `maxSockets`)
* `pool.maxSockets` - Integer containing the maximum amount of sockets in the pool.
* `timeout` - Integer containing the number of milliseconds to wait for a request to respond before aborting the request
* `proxy` - An HTTP proxy to be used. Supports proxy Auth with Basic Auth, identical to support for the `url` parameter (by embedding the auth info in the `uri`)
* `oauth` - Options for OAuth HMAC-SHA1 signing. See documentation above.
* `hawk` - Options for [Hawk signing](https://github.com/hueniverse/hawk). The `credentials` key must contain the necessary signing info, [see hawk docs for details](https://github.com/hueniverse/hawk#usage-example).
* `strictSSL` - If `true`, requires SSL certificates be valid. **Note:** to use your own certificate authority, you need to specify an agent that was created with that CA as an option.
* `jar` - If `true` and `tough-cookie` is installed, remember cookies for future use (or define your custom cookie jar; see examples section)
* `aws` - `object` containing AWS signing information. Should have the properties `key`, `secret`. Also requires the property `bucket`, unless you’re specifying your `bucket` as part of the path, or the request doesn’t use a bucket (i.e. GET Services)
* `httpSignature` - Options for the [HTTP Signature Scheme](https://github.com/joyent/node-http-signature/blob/master/http_signing.md) using [Joyent's library](https://github.com/joyent/node-http-signature). The `keyId` and `key` properties must be specified. See the docs for other options.
* `localAddress` - Local interface to bind for network connections.
* `gzip` - If `true`, add an `Accept-Encoding` header to request compressed content encodings from the server (if not already present) and decode supported content encodings in the response.
* `tunnel` - If `true`, then *always* use a tunneling proxy.  If
  `false` (default), then tunneling will only be used if the
  destination is `https`, or if a previous request in the redirect
  chain used a tunneling proxy.
* `proxyHeaderWhiteList` - A whitelist of headers to send to a
  tunneling proxy.


The callback argument gets 3 arguments: 

1. An `error` when applicable (usually from [`http.ClientRequest`](http://nodejs.org/api/http.html#http_class_http_clientrequest) object)
2. An [`http.IncomingMessage`](http://nodejs.org/api/http.html#http_http_incomingmessage) object
3. The third is the `response` body (`String` or `Buffer`, or JSON object if the `json` option is supplied)


## 实现的接口

* Bucket
  * listBuckets
  * putBucket
  * deleteBucket
* Object
  * listObjects
  * headObject
  * getObject
  * putObject
  * deleteObject
  * signedUrl
* Multipart upload object
  * Init Multipart upload 
  * Upload Part 
  * List Parts 
  * Abort MulitpartUplod 
  * Complete MulitpartUplod 
  * List MulitpartUplod 

#### 获取所有Bucket 

该接口对应于API 中的GET Service,可以通过该接口获得用户的所有Bucket 信息
 

```js
client.listBuckets(function(err, res, data) {
  if (err) {
    throw err;
  }
  
  console.log('Found', data.Buckets.length, 'buckets.');
  data.Buckets.forEach(function(bucket) {
    console.log('Bucket:', bucket.Name);
  });
});
```

### Bucket 相关接口
#### 新建Bucket 

该接口对应于京东云存储API 中的PUT Bucket 接口，该接口可以创建一个新的Bucket 
 

```js
client.putBucket('bucket-test', function(err, res, data) {
  if (err) {
    throw err;
  }
});
```

#### 删除指定Bucket 

该接口对应于京东云存储API 中的DELETE Bucket 接口，可通过该接口删除指定的Bucket， 

**注意：**必须确保要删除的Bucket 中没有任何数据。
 

```js
client.deleteBucket('bucket-test', function(err, res, data) {
  if (err) {
    throw err;
  }
});
```

#### 列出指定Bucket 下Objects 

该接口对应于京东云存储API 的Get Bucket 接口，通过该接口可以获得指定Bucket 中的Object 信息列表，请求时可以通过一些查询条件来限制返回的结果。
 

```js
client.listObjects('bucket-test', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  console.log('Found', data.Contents.length, 'objects.');
  data.Contents.forEach(function(obj) {
    console.log('Object:', obj.Key);
  });
});
```

### Object 相关接口
#### 新建Object 

该接口对应于京东云存储API 中的PUT OBJECT 接口，该接口用来上传一个新的Object 到指定的Bucket 中，数据的最大长度限制为5GB。
 

```js
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
```

**注意：** 如果Bucket 下已存在$name 对象，此操作将会失败。

**注意：** 如果新建Object 大小太大，此接口调用可能会由于超时意外退出，请正确设置脚本超时时间（set_time_limit()）。

#### 获取（下载）Object 

该接口对应京东云存储API 的GET OBJECT 接口，可通过该接口获取指定Object 内容
 

```js
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
```

在Web应用里面，可以使用流直接pipe到客户端，这样就不必使用临时文件和占用大量内存。

```js
var bucket = req.params.bucket;
var object = req.params.object;
client.pipeObject(bucket, object, res);
```


**注意：**如果$localfile 已存在，此操作将会覆盖本地文件。
**注意：**如果Object 大小太大，此接口调用可能会由于超时意外退出，请正确设置脚本超时时间（set_time_limit()）。


#### 获取Object 资源链接URI 

该接口用于获取Object 的资源链接URI，可通过设置参数expire 设定链接的过期时间。
 

```js
var signedUrl = client.signedUrl('GET', 'books', 'cat.jpg');
console.log('Signed url: ', signedUrl);
```

#### 获取Object 的meta 信息

该接口对应于京东云存储API 的HEAD Object 接口，通过该接口可以获取指定Object 的元数据信息。
 

```js
client.headObject('bucket-test', 'test-object-key.jpg', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  for (var key in res.headers) {
    console.log(key, '=', res.headers[key]);
  }
});
```

#### 删除Object 

该接口对应于京东云存储API 的DELETE Object 接口，用于删除指定的Object 

```js
client.deleteObject('bucket-test', 'test-object-key.jpg', function(err, res, data) {
  if (err) {
    throw err;
  }
  
  console.log('Delete sucsess.');
});
```

#### 生成用于外链的签名的URL

默认Expires为5min。

```js
var signedUrl = client.signedUrl('GET', 'books', 'cat.jpg');
console.log('Signed url: ', signedUrl);
```

### Multipart Upload 相关接口
#### Put Object with Multipart Upload 

该接口对应于京东云存储的multipart 相关接口，用于使用Multipart Upload 上传一个大文件。
 

```js

```

#### Init Multipart upload 

该接口对应于京东云存储的init multipart upload 接口，用于初始化一个分块上传。
 

```js

```

#### Upload Part 

该接口对应于京东云存储的Upload Part 接口，用于向一个指定uploadID 的MultipartUpload 上传一个分块。
 

```js

```

#### List Parts 

该接口对应于京东云存储的List Part 接口，用于获取一个指定uploadID 的MultipartUpload 所有已上传的分块列表。
 

```js

```

#### Abort MulitpartUplod 

该接口对应于京东云存储的Abort MultipartUpload 接口，用于删除一个指定uploadId 所在的MultipartUpload. 
 

```js

```

#### Complete MulitpartUplod 

该接口对应于京东云存储的Complete MultipartUpload 接口，用于完成一个指定uploadId 所在的MultipartUpload. 


```js

```

#### List MulitpartUplod 

该接口对应于京东云存储的List MultipartUpload 接口，用于获取一个指定Bucket 下所有未完成的MultipartUpload 对象信息
 

```js

```


## 参与开发

使用`Grunt`执行Lint检查：

```sh
$ grunt
```

**注意：** 请提交前Lint并测试你的代码。

使用mocha执行测试用例：

```sh
$ mocha
$ mocha -g 'signed url'
```

**注意：** 现在用例还不是很规范，需要自己增加config.json以及增加相应的测试文件。

## License

Copyright (c) 2014 pingjiang  
Licensed under the MIT license.
