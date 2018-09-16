// const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');

var visualRecognition = new VisualRecognitionV3({
    version: '2018-03-19',
    iam_apikey: 'QP0NFRm2O9c8SYu10OQYU4yK2voAFIbQEuQR1MI4oAao'
});



// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');


admin.initializeApp();

const mkdirp = require('mkdirp-promise');
const path = require('path');
const os = require('os');
const fs = require('fs');


// var config = {
//     projectId: 'object-detection-htn2018',
//     keyFilename: '/path/to/keyfile.json'
//   };
// const gcs = require('@google-cloud/storage')(config);
// gcs(config);
// const spawn = require('child-process-promise').spawn;
// var db = admin.database();

exports.addMessage = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/messages').push({ original: original }).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref.toString());
    });
});

exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
        // Grab the current value of what was written to the Realtime Database.
        const original = snapshot.val();
        console.log('Uppercasing', context.params.pushId, original);
        const uppercase = original.toUpperCase();
        // You must return a Promise when performing asynchronous tasks inside a Functions such as
        // writing to the Firebase Realtime Database.
        // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
        return snapshot.ref.parent.child('uppercase').set(uppercase);
    });

exports.addTempImg = functions.https.onRequest((req, res) => {
    // Grab the text parameter.
    // const original = req.query.text;
    const lat = req.query.latitude;
    const long = req.query.longitude;
    const url = req.query.url;
    console.log(lat, long, url);

    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    return admin.database().ref('/tempimgs').push({
        location: {
            latitude: lat,
            longitude: long
        },
        url: url
    }).then((snapshot) => {
        // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
        return res.redirect(303, snapshot.ref.toString());
    });
});

exports.processNewImage = functions.storage.object("/images").onFinalize(object => {
    // The Storage object.
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.
    console.log("nom: " + object.name);



    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
        console.log('This is not an image.');
        return null;
    }
    const fileDir = path.dirname(filePath);
    const fileName = path.basename(filePath);
    // const thumbFilePath = path.normalize(path.join(fileDir, `${THUMB_PREFIX}${fileName}`));
    const tempLocalFile = path.join(os.tmpdir(), fileName);
    // const tempLocalFile = path.join("/Users/v7770/Downloads", filePath)
    const tempLocalDir = path.dirname(tempLocalFile);
    console.log("dir", tempLocalDir, "file", tempLocalFile)

    // const tempLocalThumbFile = path.join(os.tmpdir(), thumbFilePath);
    const bucket = admin.storage().bucket(object.bucket);
    const file = bucket.file(filePath);
    // const thumbFile = bucket.file(thumbFilePath);
    const metadata = {
        contentType: contentType,
        // To enable Client-side caching you can set the Cache-Control headers here. Uncomment below.
        // 'Cache-Control': 'public,max-age=3600',
    };
    // return mkdirp(tempLocalDir)

        // Create the temp directory where the storage file will be downloaded.
        // mkdirp(tempLocalDir).then(()=>{

        // });
        // Download file from bucket.
        // await 

        // Get the file name.
        // const fileName = path.basename(filePath);

        // const bucket = gcs.bucket(fileBucket);
        // const tempFilePath = path.join(os.tmpdir(), fileName);
        // const metadata = {
        //     contentType: contentType,
        // };
        // return bucket.file(filePath).download({
        //     destination: tempFilePath,
        // }).then(() => {
        //     console.log('Image downloaded locally to', tempFilePath);
        //     // Generate a thumbnail using ImageMagick.
        //     // return spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath]);
        //     return fs.unlinkSync(tempFilePath)
        // }).then(()=>{
        //     return null;
        // .then(() => {
            return file.download({ destination: tempLocalFile })
        // })
        .then(() => {
            console.log('The file has been downloaded to', tempLocalFile);
            console.log("dir",tempLocalDir )
            var images_file = fs.createReadStream(tempLocalFile);

            var params = {
                images_file: images_file
            };

            visualRecognition.detectFaces(params,  function(err, response) {
                if (err)
                  console.log(err);
                else
                  console.log(JSON.stringify(response, null, 2))
                fs.unlinkSync(tempLocalFile);
                // fs.unlinkSync(tempLocalThumbFile);
                // console.log(res)
                return console.log("odone");
              })
        })
        // .then(() => {

        //     fs.unlinkSync(tempLocalFile);
        //     // fs.unlinkSync(tempLocalThumbFile);
        //     // console.log(res)
        //     return console.log("odone");
        // })
});
    // .then(() => {
    //     console.log('Thumbnail created at', tempFilePath);
    //     // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    //     const thumbFileName = `thumb_${fileName}`;
    //     const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    //     // Uploading the thumbnail.
    //     // return bucket.upload(tempFilePath, {
    //     //     destination: thumbFilePath,
    //     //     metadata: metadata,
    //     // });
    //     return null;
    //     // Once the thumbnail has been uploaded delete the local file to free up disk space.
    // })
    // .then(() => fs.unlinkSync(tempFilePath));

    // return null;
// });

// exports.addImageTag = functions.https.onRequest((req,res)=>{
//     let rf = db.ref("/tempimgs");
//     var newPostRef = rf.push();
//     return newPostRef.set({
//         location:{
//             latitude: req.query.latitude,
//             longitude:req.query.longitude
//         },
//         url: ref.query.url
//     }).then((snapshot) => {
//         // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
//         return res.redirect(303, snapshot.ref.toString());
//       });


//     // // we can also chain the two calls together
//     // postsRef.push().set({
//     // author: "alanisawesome",
//     // title: "The Turing Machine"
//     // });
// })