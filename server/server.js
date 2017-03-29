var firebase = require("firebase");
var request = require('request');
var admin = require("firebase-admin");
// Initialize Firebase
// TODO: Replace with your project's customized code snippet
var admin = require("firebase-admin");
var serviceAccount = require("./theflippening-firebase-adminsdk-jsgw4-ab0c7407a6.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://theflippening.firebaseio.com"
});

var TIME = 1000 * 6;
url = "https://api.coinmarketcap.com/v1/ticker/?limit=3";
poller= function doPoll(){
    request(url, function(error, response, body) {
        writeData(JSON.parse(body));
     });
   };
setInterval(poller, TIME);


function writeData(data) {
  admin.database().ref('coinmarketcap/current').set(data);
}

var dataRef = admin.database().ref('coinmarketcap/current');
dataRef.on('value', function(snapshot) {
  console.log(snapshot.val());

});
