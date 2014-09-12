/**
 * Module dependencies.
 */

var net = require('net');
var crypto = require('crypto');
var _path = require('path');

var JSS_BUCKET_REGEXP = /^[a-z0-9]{1}[a-z0-9\.\-_]{2,254}$/;

/**
 * 替换url中的变量 /${bucket}/${key}
 *
 * @param  {String} url
 * @param  {Object} args
 * @api public
 */
exports.replaceVars = function(url, args){
	var result = url;
	if (!args) {
	  return url;
	}

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
 * @api public
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
};

var MIME_MAP = {
  '3gp': 'video/3gpp',
  'ai': 'application/postscript',
  'aif': 'audio/x-aiff',
  'aifc': 'audio/x-aiff',
  'aiff': 'audio/x-aiff',
  'asc': 'text/plain',
  'atom': 'application/atom+xml',
  'au': 'audio/basic',
  'avi': 'video/x-msvideo',
  'bcpio': 'application/x-bcpio',
  'bin': 'application/octet-stream',
  'bmp': 'image/bmp',
  'cdf': 'application/x-netcdf',
  'cgm': 'image/cgm',
  'class': 'application/octet-stream',
  'cpio': 'application/x-cpio',
  'cpt': 'application/mac-compactpro',
  'csh': 'application/x-csh',
  'css': 'text/css',
  'dcr': 'application/x-director',
  'dif': 'video/x-dv',
  'dir': 'application/x-director',
  'djv': 'image/vnd.djvu',
  'djvu': 'image/vnd.djvu',
  'dll': 'application/octet-stream',
  'dmg': 'application/octet-stream',
  'dms': 'application/octet-stream',
  'doc': 'application/msword',
  'dtd': 'application/xml-dtd',
  'dv': 'video/x-dv',
  'dvi': 'application/x-dvi',
  'dxr': 'application/x-director',
  'eps': 'application/postscript',
  'etx': 'text/x-setext',
  'exe': 'application/octet-stream',
  'ez': 'application/andrew-inset',
  'flv': 'video/x-flv',
  'gif': 'image/gif',
  'gram': 'application/srgs',
  'grxml': 'application/srgs+xml',
  'gtar': 'application/x-gtar',
  'gz': 'application/x-gzip',
  'hdf': 'application/x-hdf',
  'hqx': 'application/mac-binhex40',
  'htm': 'text/html',
  'html': 'text/html',
  'ice': 'x-conference/x-cooltalk',
  'ico': 'image/x-icon',
  'ics': 'text/calendar',
  'ief': 'image/ief',
  'ifb': 'text/calendar',
  'iges': 'model/iges',
  'igs': 'model/iges',
  'jnlp': 'application/x-java-jnlp-file',
  'jp2': 'image/jp2',
  'jpe': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/x-javascript',
  'kar': 'audio/midi',
  'latex': 'application/x-latex',
  'lha': 'application/octet-stream',
  'lzh': 'application/octet-stream',
  'm3u': 'audio/x-mpegurl',
  'm4a': 'audio/mp4a-latm',
  'm4p': 'audio/mp4a-latm',
  'm4u': 'video/vnd.mpegurl',
  'm4v': 'video/x-m4v',
  'mac': 'image/x-macpaint',
  'man': 'application/x-troff-man',
  'mathml': 'application/mathml+xml',
  'me': 'application/x-troff-me',
  'mesh': 'model/mesh',
  'mid': 'audio/midi',
  'midi': 'audio/midi',
  'mif': 'application/vnd.mif',
  'mov': 'video/quicktime',
  'movie': 'video/x-sgi-movie',
  'mp2': 'audio/mpeg',
  'mp3': 'audio/mpeg',
  'mp4': 'video/mp4',
  'mpe': 'video/mpeg',
  'mpeg': 'video/mpeg',
  'mpg': 'video/mpeg',
  'mpga': 'audio/mpeg',
  'ms': 'application/x-troff-ms',
  'msh': 'model/mesh',
  'mxu': 'video/vnd.mpegurl',
  'nc': 'application/x-netcdf',
  'oda': 'application/oda',
  'ogg': 'application/ogg',
  'ogv': 'video/ogv',
  'pbm': 'image/x-portable-bitmap',
  'pct': 'image/pict',
  'pdb': 'chemical/x-pdb',
  'pdf': 'application/pdf',
  'pgm': 'image/x-portable-graymap',
  'pgn': 'application/x-chess-pgn',
  'pic': 'image/pict',
  'pict': 'image/pict',
  'png': 'image/png',
  'pnm': 'image/x-portable-anymap',
  'pnt': 'image/x-macpaint',
  'pntg': 'image/x-macpaint',
  'ppm': 'image/x-portable-pixmap',
  'ppt': 'application/vnd.ms-powerpoint',
  'ps': 'application/postscript',
  'qt': 'video/quicktime',
  'qti': 'image/x-quicktime',
  'qtif': 'image/x-quicktime',
  'ra': 'audio/x-pn-realaudio',
  'ram': 'audio/x-pn-realaudio',
  'ras': 'image/x-cmu-raster',
  'rdf': 'application/rdf+xml',
  'rgb': 'image/x-rgb',
  'rm': 'application/vnd.rn-realmedia',
  'roff': 'application/x-troff',
  'rtf': 'text/rtf',
  'rtx': 'text/richtext',
  'sgm': 'text/sgml',
  'sgml': 'text/sgml',
  'sh': 'application/x-sh',
  'shar': 'application/x-shar',
  'silo': 'model/mesh',
  'sit': 'application/x-stuffit',
  'skd': 'application/x-koan',
  'skm': 'application/x-koan',
  'skp': 'application/x-koan',
  'skt': 'application/x-koan',
  'smi': 'application/smil',
  'smil': 'application/smil',
  'snd': 'audio/basic',
  'so': 'application/octet-stream',
  'spl': 'application/x-futuresplash',
  'src': 'application/x-wais-source',
  'sv4cpio': 'application/x-sv4cpio',
  'sv4crc': 'application/x-sv4crc',
  'svg': 'image/svg+xml',
  'swf': 'application/x-shockwave-flash',
  't': 'application/x-troff',
  'tar': 'application/x-tar',
  'tcl': 'application/x-tcl',
  'tex': 'application/x-tex',
  'texi': 'application/x-texinfo',
  'texinfo': 'application/x-texinfo',
  'tif': 'image/tiff',
  'tiff': 'image/tiff',
  'tr': 'application/x-troff',
  'tsv': 'text/tab-separated-values',
  'txt': 'text/plain',
  'ustar': 'application/x-ustar',
  'vcd': 'application/x-cdlink',
  'vrml': 'model/vrml',
  'vxml': 'application/voicexml+xml',
  'wav': 'audio/x-wav',
  'wbmp': 'image/vnd.wap.wbmp',
  'wbxml': 'application/vnd.wap.wbxml',
  'webm': 'video/webm',
  'wml': 'text/vnd.wap.wml',
  'wmlc': 'application/vnd.wap.wmlc',
  'wmls': 'text/vnd.wap.wmlscript',
  'wmlsc': 'application/vnd.wap.wmlscriptc',
  'wmv': 'video/x-ms-wmv',
  'wrl': 'model/vrml',
  'xbm': 'image/x-xbitmap',
  'xht': 'application/xhtml+xml',
  'xhtml': 'application/xhtml+xml',
  'xls': 'application/vnd.ms-excel',
  'xml': 'application/xml',
  'xpm': 'image/x-xpixmap',
  'xsl': 'application/xml',
  'xslt': 'application/xslt+xml',
  'xul': 'application/vnd.mozilla.xul+xml',
  'xwd': 'image/x-xwindowdump',
  'xyz': 'chemical/x-xyz',
  'zip': 'application/zip'  
};

/**
 * 根据文件名后缀判断Content-Type
 *
 * @param  {String} filename
 * @api public
 */
exports.guessContentType = function (filename) {
  var ext = _path.extname(filename);
  if (ext.indexOf('.') === 0) {
    ext = ext.substring(1);
  }
  return MIME_MAP[ext] || MIME_MAP['bin'];
};

/**
 * 计算Buffer的MD5值，如果不是Buffer就返回空
 *
 * @param  {Buffer} data
 * @api public
 */
exports.contentMD5 = function(data) {
  if (!Buffer.isBuffer(data)) {
    return '';
  }
  
  return crypto.createHash('md5').update(data).digest('hex');
};
