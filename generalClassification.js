var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var fs = require('fs');

var visualRecognition = new VisualRecognitionV3({
  version: '2018-03-19',
  iam_apikey: 'QP0NFRm2O9c8SYu10OQYU4yK2voAFIbQEuQR1MI4oAao'
});

var images_file= fs.createReadStream('/Users/amanbrar/desktop/yonko.png');
var owners = ["me"];
var threshold = 0.6;

var params = {
  images_file: images_file,
  owners: owners,
  threshold: threshold
};

visualRecognition.classify(params, function(err, response) {
  if (err)
    console.log(err);
  else
    console.log(JSON.stringify(response, null, 2))
});
