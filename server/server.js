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

const KOEPPELMANN = 0.06207;
var maximumRate=0;

function roundPc(x){return Math.round((x + 1e-15) * 10000) / 100;}//1e-15 scaling for binary division problems
function round2(x){return Math.round((x + 1e-15) * 10000) / 10000;}//1e-15 scaling for binary division problems

url = "https://api.coinmarketcap.com/v1/ticker/?limit=2";
var historyRef = admin.database().ref('coinmarketcap/history');
var statisticsRef = admin.database().ref('coinmarketcap/statistics');
poller= function doPoll(){
    request(url, function(error, response, body) {
         try {
           const d = JSON.parse(body);
           writeData(d);
         } catch (e){
           console.log("JSON parse exception ", e);
         }
     });
   };

TIME= 6 * 1000 * 2;
setInterval(poller, TIME);


function writeData(data) {
  const stats= {};
  const btc = (data).filter((i,n) => i.id==="bitcoin")[0];
  const eth = (data).filter((i,n) => i.id==="ethereum")[0];
  stats.btc_marcap = Number(btc.market_cap_usd);
  stats.eth_marcap = Number(eth.market_cap_usd);
  stats.btc_price = Number(btc.price_usd);
  stats.eth_price = Number(eth.price_usd);
  stats.ethbtc_price = Number(eth.price_btc);
  stats.koeppel_diff_btc = stats.ethbtc_price - KOEPPELMANN;
  stats.koeppel_diff_usd = stats.koeppel_diff_btc * stats.btc_price;
  stats.btc_supply = Number(btc.available_supply);
  stats.eth_supply = Number(eth.available_supply);
  stats.btc_breakevenprice = stats.eth_marcap/stats.btc_supply;
  stats.eth_breakevenprice = stats.btc_marcap/stats.eth_supply;
  stats.ethbtc = stats.eth_marcap / stats.btc_marcap;
  if (maximumRate < stats.ethbtc) maximumRate = stats.ethbtc;

  //admin.database().ref('coinmarketcap/current').set(data);
  historyRef.push().set(stats);
  statisticsRef.set({'maximumRate': maximumRate});
}

var dataRef = admin.database().ref('coinmarketcap/current');
dataRef.on('value', function(snapshot) {
  console.log(snapshot.val());

});
