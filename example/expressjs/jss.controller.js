/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /jss              ->  index
 * POST    /jss              ->  create
 * GET     /jss/:id          ->  show
 * PUT     /jss/:id          ->  update
 * DELETE  /jss/:id          ->  destroy
 */

'use strict';

var util = require('util');
var fs = require('fs');
var _ = require('lodash');
var formidable = require('formidable');
var Jss = require('./jss.model');
var JSSClient = require('jss-sdk');
var config = require('../../config/environment');

var client = new JSSClient(config.jss);

// Get list of buckets
exports.listBuckets = function(req, res) {
  client.listBuckets(function(err, jssres, data) {
    if (err) {
      return handleError(res, err);
    }
    
    res.json(200, {
      buckets: data.Buckets
    });
  });
};

// Creates bucket
exports.putBucket = function(req, res) {
  var bucket = req.params.bucket || req.body.bucket;
  client.putBucket(bucket, function(err, jssres, data) {
    if (err) {
      return handleError(res, err);
    }
    
    res.json(200, {
      data: data
    });
  });
};

// Deletes a jss from the DB.
exports.deleteBucket = function(req, res) {
  var bucket = req.params.bucket || req.body.bucket;
  client.deleteBucket(bucket, function(err, jssres, data) {
    if (err) {
      return handleError(res, err);
    }
    
    res.json(200, {
      data: data
    });
  });
};

// Get list of objects in bucket
exports.listObjects = function(req, res) {
  var bucket = req.params.bucket;
  client.listObjects(bucket, function(err, jssres, data) {
    if (err) {
      return handleError(res, err);
    }
    
    res.json(200, {
      bucket: bucket,
      contents: data.Contents
    });
  });
};

// upload object to jss
exports.putObject = function(req, res) {
  var bucket = req.params.bucket;
  var object = req.params.object;
  var form = new formidable.IncomingForm();
  
  form.parse(req, function(err, fields, files) {
    if (err) {
      return handleError(res, err);
    }
    
    var allfiles = util.isArray(files) ? files : [files];
    var counter = allfiles.length, results = [], finish = function () {
      counter -= 1;
      if (counter === 0) {
        res.json(200, {
          files: results
        });
      }
    };
    
    bucket = bucket || fields.bucket;
    object = object || fields.object;
    
    allfiles.forEach(function(allfile) {
      var file = allfile.files || allfile;
      fs.readFile(file.path, function(err, data) {
        if (err) {
          return handleError(res, err);
        }
        client.putObject(bucket, object || file.name, file.name, data, function(err, res, data) {
          if (err) {
            return handleError(res, err);
          }
          
          results.push(data);
          finish();
        });
      });
    });
  });
};

// Pipe object from jss to user
exports.pipeObject = function(req, res) {
  var bucket = req.params.bucket;
  var object = req.params.object;
  client.pipeObject(bucket, object, res);
};

// Generate signed url
exports.signedUrl = function(req, res) {
  var bucket = req.params.bucket;
  var object = req.params.object;
  var signedUrl = client.signedUrl('GET', bucket, object);
  return res.json(200, {
    bucket: bucket,
    object: object,
    url: signedUrl
  });
};

// Head meta info of object
exports.headObject = function(req, res) {
  var bucket = req.params.bucket;
  var object = req.params.object;
  client.headObject(bucket, object, function(err, jssres, data) {
    if (err) {
      return handleError(res, err);
    }
    
    res.json(200, {
      bucket: bucket,
      object: object,
      contentType: jssres.headers['content-type']
    });
  });
};

// Deletes a object from bucket
exports.deleteObject = function(req, res) {
  var bucket = req.params.bucket;
  var object = req.params.object;
  client.deleteObject(bucket, object, function(err, jssres, data) {
    if (err) {
      return handleError(res, err);
    }
    
    res.json(200, {
      data: data
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}
