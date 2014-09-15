'use strict';

var express = require('express');
var controller = require('./jss.controller');

var router = express.Router();

router.get('/', controller.listBuckets);
router.post('/create', controller.putBucket);
router.put('/:bucket', controller.putBucket);
router.delete('/:bucket', controller.deleteBucket);

router.get('/:bucket', controller.listObjects);
router.post('/:bucket/upload', controller.putObject);
router.put('/:bucket/:object', controller.putObject);
router.get('/:bucket/:object', controller.pipeObject);
router.delete('/:bucket/:object', controller.deleteObject);

router.get('/:bucket/:object/url', controller.signedUrl);
router.get('/:bucket/:object/meta', controller.headObject);

module.exports = router;
