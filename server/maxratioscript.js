//curl http://coinmarketcap.northpole.ro/api/v5/history/ETH_2017.json
//btc= b.history;
//x= eth.history;

Object.prototype[Symbol.iterator] = function*() {
    for(let key of Object.keys(this)) {
         yield key
    }
 }
 
for (let i in x){
    let b = Number(btc[i]);
    let e = Number(x[i].marketCap.usd);
    if (e/b > max) {
        max = e/b;
        console.log(i);
    }
}
