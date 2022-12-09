exports.id=0,exports.modules={"./src/server/server.js":function(e,n,t){"use strict";t.r(n);var o=t("./src/server/config.json"),s=t("web3"),c=t.n(s),a=t("express"),r=t.n(a),i=t("cors"),l=t.n(i),u=t("./build/contracts/FlightSuretyApp.json"),f=t("./build/contracts/FlightSuretyData.json"),h=o.localhost,d=new c.a(new c.a.providers.WebsocketProvider(h.url.replace("http","ws"))),g=r()();g.use(l()()),d.eth.defaultAccount=d.eth.accounts[0];var m=new d.eth.Contract(u.abi,h.appAddress),p=new d.eth.Contract(f.abi,h.dataAddress),v=[],A=[],E=b,b=10;m.events.OracleRequest({fromBlock:"latest"},(function(e,n){var t=n.returnValues.index;console.log("index !!",t),console.log("oraclesIndexies",A);var o=0;A.forEach((function(e){console.log("indexes !!",e);var s=v[o];e[0]!=t&&e[1]!=t&&e[2]!=t||function(e,n,t,o,s){console.log("in 1"),m.methods.submitOracleResponse(n,t,o,s,E).send({from:e,gas:4e5,gasPrice:3e7}),20==E&&(console.log("innn"),p.methods.creditInsurees(o).call({from:e}))}(s,t,n.returnValues.airline,n.returnValues.flight,n.returnValues.timestamp),o++}))})),p.events.allEvents({fromBlock:"latest"},(function(e,n){e?console.log("error",e):console.log("event",n)})),new Promise((function(e,n){d.eth.getAccounts().then((function(e){return v=e.slice(20,45)})).catch((function(e){n(e)}))})).then((function(e){var n;(n=e,new Promise((function(e,t){m.methods.REGISTRATION_FEE().call().then((function(o){for(var s=function(e){m.methods.registerOracle().send({from:n[e],value:o,gas:4e6,gasPrice:3e7}).then((function(){m.methods.getMyIndexes().call({from:n[e]}).then((function(e){console.log("in orache",e),A.push(e)})).catch((function(e){t(e)}))})).catch((function(e){t(e)}))},c=0;c<25;c++)s(c);e(A)})).catch((function(e){t(e)}))}))).catch((function(e){console.log(e.message)}))})),g.get("/api",(function(e,n){n.send({message:"An API for use with your Dapp!"})})),g.get("/api/status/:status",(function(e,n){var t="Status changed, ";switch(e.params.status){case"10":E=b,t=t.concat("ON TIME");break;case"20":E=20,t=t.concat("LATE AIRLINE");break;case"30":E=30,t=t.concat("LATE WEATHER");break;case"40":E=40,t=t.concat("LATE TECHNICAL");break;case"50":E=50,t=t.concat("LATE OTHER");break;default:E=0,t=t.concat("UNKNOWN")}n.send({message:t})})),g.listen(80,(function(){console.log("app listening on port",80)})),n.default=g}};