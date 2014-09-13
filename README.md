# 京东云存储-NodeJS SDK (jss-sdk) [![Build Status](https://secure.travis-ci.org/pingjiang/jss-sdk.png?branch=master)](http://travis-ci.org/pingjiang/jss-sdk)

京东云存储的一些基本概念请参考[wiki](https://github.com/pingjiang/jss-sdk/wiki)。

京东云存储控制台：[http://man.jcloud.com/appengine/jae/console/addons/jss](http://man.jcloud.com/appengine/jae/console/addons/jss)。


## 快速入门

使用`npm`安装依赖：

```sh
$ npm install jss-sdk --save
```

安装命令行工具：

```sh
$ npm install -g jss-sdk
$ jss --help
$ jss --version
```

创建`JSSClient`：

```js
var JSSClient = require('jss-sdk');

// pass appKey and appSecret.
var client = new JSSClient('your appkey', 'your appSecret');

// pass optional defaults of Request.
var client = new JSSClient('your appKey', 'your appSecret', { followRedirect: true });

// pass defaults with appKey and appSecret.
var client = new JSSClient({ appKey: 'your appKey', appSecret: 'your appSecret' });
```

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
  
  for (var bucket in data.Buckets) {
    console.log(bucket.Name);
  }
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
  
  for (var obj in data.Contents) {
    console.log(obj.Key);
  }
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
  
  for (var header in res.headers) {
    console.log(header);
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
