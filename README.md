# 京东云存储-NodeJS SDK (jss-sdk) [![Build Status](https://secure.travis-ci.org/pingjiang/jss-sdk.png?branch=master)](http://travis-ci.org/pingjiang/jss-sdk)

> Jingdong cloud storage service sdk.


## Getting Started

Install the module with: `npm install jss-sdk`

```js
var jss = require('jss');
jss.awesome(); // "awesome"
```

Install with cli command

```sh
$ npm install -g jss-sdk
$ jss --help
$ jss --version
```

## 文档


京东云存储-NodeJS SDK 

### 系统要求
京东云存储PHP SDK 需要CURL 库支持, 在使用前请检查您系统中安装的PHP 是否已支
持PHP CURL。

### 基本概念
#### AccessKey && AccessSecret 
京东云存储所有API 操作都需要对请求做AccessSecret 签名的校验，摘要字段将作为请求头发送给云存储系统，所以在使用PHP SDK 时必须先设定有效的AccessKey 和AccessSecret。

> **AccessKey** 由京东云存储颁发，用于标识用户的唯一身份。AccessKey 在所有的操作中都会被使用，并且以明文形式传输。
> 
> **AccessSecret** 由京东云存储颁发，用于请求头部的签名。AccessSecret 总是随同AccessKey 一起分发，一个AccessKey 对应一个AccessSecret。  

**注意：** 

* AccessSecret 涉及您存储资料的安全性，所以请妥善保存您的AccessSecret，不要泄漏给第三方。
* 任何时候AccessSecret 都不应作为请求头或内容发送给京东云存储系统。

#### Bucket 

Bucket 是数据存储的基本容器。你可以把Bucket 想象成文件系统中的目录，与目录不同的是Bucket 不支持嵌套。
在用户空间内，用户可以根据需要创建不同的Bucket。京东云存储系统中每个用户空间内最多只能创建1000 个Bucket。

Bucket 命名规则:

* 由小写字母或数字或点号(.)或下划线(_)或破折号(-)组合而成
* 开头必须是小写字母或数字
* 长度必须大于等于3 字节且小于等于255 字节
* 不能是一个IP 地址形式，如192.168.1.1 是不允许的
* 不能以jingdong 作为Bucket 名称前缀
* 如果希望以后提供DNS 解析，则Bucket 命名还必须需符合DNS 主机名的命名

**注意：** 京东云存储系统中Bucket 名称全局唯一，即在云存储系统中任何Bucket 名称都不能重复。例如：用户A 创建了名为“a_bucket”的Bucket 后，用户B 尝试创建名字同样为“a_bucket”的Bucket 将会失败。


#### Object 
Object 是数据存储的的基本单元。用户在京东云存储中存储的任何内容都以Object 形式存在。每个Object 由两个部分组成：Object Data 和Object Meta。Object Data 即存储对象的实际内容数据，Object Meta 为包含对象属性的一系列Key-Value 键值对。Object 必须存储在Bucket 下。

Object 命名规则:

* 使用UTF-8 编码
* 长度必须大于等于1 字节且小于等于1024 字节


**注意：** 同一Bucket 下的Object 名称必须唯一！ 


### PHP SDK 概述

京东云存储PHP SDK 为多个文件，核心文件为JDCloudStorage.php，通常您只需要导入该文件便可完成所有SDK 目前能提供的所有接口。
 
```

```

### PHP SDK 文档

PHP SDK 定义了三个用于云存储的对象： 

* JSSBucket：每个JSSBucket 对象表示一个京东云存储Bucket； 
* JSSObject：每个JSSObject 对象表示一个京东云存储Object； 
* JSSEntity：每个JSSEntity 对象表示一个京东云存储Bucket 及其包含的Object 列表的集合； 

PHP SDK 定义了一个通用的异常对象： 

* JSSError：每个请求对应的非20x 响应（http status code 不在200~299 之间）都会转换成一个JSSError 异常对象并抛出； 

PHP SDK 定义了两个辅助的HTTP 对象

* JSSRequest：几乎封装了所有的HTTP 请求，用户不需要关心。
* JSSResponse：封装了SDK 中http 请求的返回信息，包括response_code,response body,response header 三个基本信息维护。

PHP SDK 定义了一个文件类型辅助对象： 

* JSSMIME：你可以调用JSSMIME::get_type($file_extension)根据文件扩展名获取其
对应的类型； 

**注意：** PHP SDK 中所有的API 调用只有在成功时才返回正确的数据，其他任何错误都将以异常的形态抛出！
 
#### 通用接口
##### 初始化JDCloudStorage 对象
 

```

```

##### JSSError 异常信息
对象定义： 
在访问云存储过程中，所有没有能够正常完成服务请求的操作，都会返回JSSError,该Exception 是由Exception 派生而来，JSSError 的对象中， 并会得出以下由存储服务器获得到的错误返回的响应：错误码，错误信息，请求资源，请求ID。

代码示例：
 
例如在创建2 次Bucket 时候,代码如下

```

```

#### Service 相关接口
##### 获取所有Bucket 

该接口对应于API 中的GET Service,可以通过该接口获得用户的所有Bucket 信息
 

```

```

#### Bucket 相关接口
##### 新建Bucket 

该接口对应于京东云存储API 中的PUT Bucket 接口，该接口可以创建一个新的Bucket 
 

```

```

##### 删除指定Bucket 

该接口对应于京东云存储API 中的DELETE Bucket 接口，可通过该接口删除指定的Bucket， 

**注意：**必须确保要删除的Bucket 中没有任何数据。
 

```

```

##### 列出指定Bucket 下Objects 

该接口对应于京东云存储API 的Get Bucket 接口，通过该接口可以获得指定Bucket 中的Object 信息列表，请求时可以通过一些查询条件来限制返回的结果。
 

```

```

#### Object 相关接口
##### 新建Object 

该接口对应于京东云存储API 中的PUT OBJECT 接口，该接口用来上传一个新的Object 到指定的Bucket 中，数据的最大长度限制为5GB。
 

```

```

**注意：** 如果Bucket 下已存在$name 对象，此操作将会失败。

**注意：** 如果新建Object 大小太大，此接口调用可能会由于超时意外退出，请正确设置脚本超时时间（set_time_limit()）。

##### 获取（下载）Object 

该接口对应京东云存储API 的GET OBJECT 接口，可通过该接口获取指定Object 内容
 

```

```

**注意：**如果$localfile 已存在，此操作将会覆盖本地文件。
**注意：**如果Object 大小太大，此接口调用可能会由于超时意外退出，请正确设置脚本超时时间（set_time_limit()）。


##### 获取Object 资源链接URI 

该接口用于获取Object 的资源链接URI，可通过设置参数expire 设定链接的过期时间。
 

```

```

##### 获取Object 的meta 信息

该接口对应于京东云存储API 的HEAD Object 接口，通过该接口可以获取指定Object 的元数据信息。
 

```

```

##### 删除Object 

该接口对应于京东云存储API 的DELETE Object 接口，用于删除指定的Object 


```

```

#### Multipart Upload 相关接口
##### Put Object with Multipart Upload 

该接口对应于京东云存储的multipart 相关接口，用于使用Multipart Upload 上传一个大文件。
 

```

```

##### Init Multipart upload 

该接口对应于京东云存储的init multipart upload 接口，用于初始化一个分块上传。
 

```

```

##### Upload Part 

该接口对应于京东云存储的Upload Part 接口，用于向一个指定uploadID 的MultipartUpload 上传一个分块。
 

```

```

##### List Parts 

该接口对应于京东云存储的List Part 接口，用于获取一个指定uploadID 的MultipartUpload 所有已上传的分块列表。
 

```

```

##### Abort MulitpartUplod 

该接口对应于京东云存储的Abort MultipartUpload 接口，用于删除一个指定uploadId 所在的MultipartUpload. 
 

```

```

##### Complete MulitpartUplod 

该接口对应于京东云存储的Complete MultipartUpload 接口，用于完成一个指定uploadId 所在的MultipartUpload. 


```

```

##### List MulitpartUplod 

该接口对应于京东云存储的List MultipartUpload 接口，用于获取一个指定Bucket 下所有未完成的MultipartUpload 对象信息
 

```

```

## Examples

_(Coming soon)_


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com).


## License

Copyright (c) 2014 pingjiang  
Licensed under the MIT license.
