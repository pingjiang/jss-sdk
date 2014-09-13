#! /usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');

var existsSync = fs.existsSync || path.existsSync;

var JSSClient;
try {
    JSSClient = require('jss-sdk');
} catch(err) {
    JSSClient = require('./lib/jss');
}

var program = require('commander');
var version = require('./package').version;

var handlers = {
  "listBuckets": function(client, bucket, key, filepath, outdir) {
    client.listBuckets(function(err, res, data) {
      if (err) {
        throw err;
      }
      console.log('Found', data.Buckets.length, 'buckets.');
      data.Buckets.forEach(function(bucket) {
        console.log('Bucket:', bucket.Name);
      });
    });
  },
  "putBucket": function(client, bucket) {
    client.putBucket(bucket, function(err, res, data) {
      if (err) {
        throw err;
      }
      
      console.log('create bucket success.');
    });
  },
  "deleteBucket": function(client, bucket) {
    client.deleteBucket(bucket, function(err, res, data) {
      if (err) {
        throw err;
      }
      
      console.log('delete bucket success.');
    });
  },
  "listObjects": function(client, bucket) {
    client.listObjects(bucket, function(err, res, data) {
      if (err) {
        throw err;
      }
  
      console.log('Found', data.Contents.length, 'objects.');
      data.Contents.forEach(function(obj) {
        console.log('Object:', obj.Key);
      });
    });
  },
  "headObject": function(client, bucket, key) {
    client.headObject(bucket, key, function(err, res, data) {
      if (err) {
        throw err;
      }
  
      for (var key in res.headers) {
        console.log('Head:', key, '=', res.headers[key]);
      }
    });
  },
  "getObject": function(client, bucket, key, filepath, outdir) {
    client.getObject(bucket, key, function(err, res, data) {
      if (err) {
        throw err;
      }
  
      var outpath = path.join(outdir, key);
      fs.writeFile(outpath, data, {
        encoding: 'binary'
      }, function(err) {
        if (err) {
          throw err;
        }
    
        console.log('Write', data.length, 'bytes sucsess.');
      });
    });
  },
  "putObject": function(client, bucket, key, filepath) {
    fs.readFile(filepath, function(err, data) {
      if (err) {
        throw err;
      }
      var filename = path.basename(filepath);
      key = key || filename;
      client.putObject(bucket, key, filename, data, function(err, res, data) {
        if (err) {
          throw err;
        }
  
        console.log('Upload', key, 'success');
      });
    });
  },
  "deleteObject": function(client, bucket, key) {
    client.deleteObject(bucket, key, function(err, res, data) {
      if (err) {
        throw err;
      }
  
      console.log('Delete', key, 'sucsess.');
    });
  },
  "signedUrl": function(client, bucket, key) {
    var signedUrl = client.signedUrl('GET', bucket, key);
    console.log('Signed url: ', signedUrl);
  }
};


program
  .version(version)
  .option('-a, --api <api>', 'api name as command')
  .option('-b, --bucket <bucket>', 'bucket name')
  .option('-k, --key <key>', 'object key')
  .option('-f, --filepath <filepath>', 'filepath to upload')
  .option('-o, --outdir <dir>', 'download path')
  .option('--appkey <appKey>', 'app key')
  .option('--appsecret <appSecret>', 'app secret');

program.parse(process.argv);

// if outdir is provided, check existance (sorry no mkdir support yet)
if (program.outdir && !existsSync(program.outdir)) {
  console.error("output directory '" + program.outdir + "' doesn't exist");
  process.exit(1);
}

var appKey = program.appkey || process.env.ACCESS_KEY;
var appSecret = program.appsecret || process.env.SECRET_KEY;

if (!appKey || !appSecret) {
  console.error('Please specify --appkey, --appsecret or setup env ACCESS_KEY and SECRET_KEY provided by vendor.');
  process.exit(1);
}

var apis = Object.keys(handlers);
if (!program.api) {
  console.error('Invalid parameters: -a/--api is mandatory. support api are', apis);
  process.exit(1);
}

var client = new JSSClient(appKey, appSecret);
var api = program.api;
var handler = handlers[api];
if (typeof handler === 'function') {
  console.log('Executing api', api, '...');
  handler.call(this, client, program.bucket, program.key, program.filepath, program.outdir);
} else {
  console.error('api name', api, 'is not supported yet. only ', apis, 'is supported.');
}
