var firebase = require("firebase");
var request = require('request');
var admin = require("firebase-admin");

Initialize Firebase

var admin = require("firebase-admin");
var serviceAccount = require("./theflippening-firebase-adminsdk-jsgw4-ab0c7407a6.json");
const KOEPPELMANN = 0.05833;
const BUTERIN = 0.0762;
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://theflippening.firebaseio.com"
});


var maximumRate;

function roundPc(x){return Math.round((x + 1e-15) * 10000) / 100;}//1e-15 scaling for binary division problems
function round2(x){return Math.round((x + 1e-15) * 10000) / 10000;}//1e-15 scaling for binary division problems

url = "https://api.coinmarketcap.com/v1/ticker/?limit=5";
var historyRef = admin.database().ref('coinmarketcap/history');
var statisticsRef = admin.database().ref('coinmarketcap/statistics');

var poller = function doPoll(){
    request(url, function(error, response, body) {
         try {
           const d = JSON.parse(body);
           writeData(d);
         } catch (e){
           console.log("JSON parse exception ", e);
         }
     });
   };


const TIME= 60 * 1000 * 5; // 5 minutes
poller(); // do first run immediately
setInterval(poller, TIME); // then start polling


var last_updated_BTC, last_updated_ETH;

function writeData(data) {
  const stats= {};
  const btc = (data).filter((i,n) => i.id==="bitcoin")[0];
  const eth = (data).filter((i,n) => i.id==="ethereum")[0];

  if(last_updated_BTC != btc.last_updated || last_updated_ETH != eth.last_updated) {
      stats.btc_marcap = Number(btc.market_cap_usd);
      stats.eth_marcap = Number(eth.market_cap_usd);
      stats.btc_24h_volume_usd =Number(btc["24h_volume_usd"]);
      stats.eth_24h_volume_usd =Number(eth["24h_volume_usd"]);
      stats.btc_price = Number(btc.price_usd);
      stats.eth_price = Number(eth.price_usd);
      stats.ethbtc_price = Number(eth.price_btc);
      stats.koeppel_diff_btc = stats.ethbtc_price - KOEPPELMANN;
      stats.buterin_diff_btc = stats.ethbtc_price - BUTERIN;
      stats.btc_supply = Number(btc.available_supply);
      stats.eth_supply = Number(eth.available_supply);
      stats.btc_breakevenprice = stats.eth_marcap/stats.btc_supply;
      stats.eth_breakevenprice = stats.btc_marcap/stats.eth_supply;
      stats.ethbtc = stats.eth_marcap / stats.btc_marcap;
      stats.timestamp = Date.now();
       statisticsRef.once('value').then(function(snapshot) {
         maximumRate = snapshot.val().maximumRate || 0;
         console.log("update",maximumRate, stats.ethbtc);
         if (maximumRate < stats.ethbtc) {
           statisticsRef.set(
           {
             'maximumRateTimestamp' : admin.database.ServerValue.TIMESTAMP,
             'maximumRate': stats.ethbtc
           }
           );
         }
       });

      admin.database().ref('coinmarketcap/current').set(data);
      console.log("history will be added", stats);
       historyRef.push().set(stats);
    } else {
        console.log("data from API hasn't changed");
    }

    last_updated_BTC = btc.last_updated;
    last_updated_ETH = eth.last_updated;
}



 var now = Date.now();
 var cutoff = now - 30 * 24 * 60 * 60 * 1000;
 var old = historyRef.orderByChild('timestamp').endAt(cutoff).limitToLast(1);
 var listener = old.on('child_added', function(snapshot) {
     snapshot.ref.remove().then(function() {
     console.log("Remove succeeded.")
   })
   .catch(function(error) {
     console.log("Remove failed: " + error.message)
   });
 });
