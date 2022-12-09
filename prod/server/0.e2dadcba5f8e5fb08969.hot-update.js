exports.id=0,exports.modules={"./src/server/server.js":function(e,t,n){"use strict";n.r(t);var s=n("./src/server/config.json"),c=n("web3"),o=n.n(c),a=n("express"),r=n.n(a),u=n("cors"),i=n.n(u),l=n("./build/contracts/FlightSuretyApp.json"),f=n("./build/contracts/FlightSuretyData.json"),h=s.localhost,d=new o.a(new o.a.providers.WebsocketProvider(h.url.replace("http","ws"))),g=r()();g.use(i()()),d.eth.defaultAccount=d.eth.accounts[0];var m=new d.eth.Contract(l.abi,h.appAddress),p=new d.eth.Contract(f.abi,h.dataAddress),v=[],A=[],E=b,b=10;m.events.OracleRequest({fromBlock:"latest"},(function(e,t){var n=t.returnValues.index,s=0;A.forEach((function(e){var c=v[s];e[0]!=n&&e[1]!=n&&e[2]!=n||function(e,t,n,s,c){console.log("in 1"),m.methods.submitOracleResponse(t,n,s,c,E).send({from:e,gas:4e5,gasPrice:3e7}),20==E&&(console.log("innn"),p.methods.creditInsurees(s).call({from:e}))}(c,n,t.returnValues.airline,t.returnValues.flight,t.returnValues.timestamp),s++}))})),p.events.allEvents({fromBlock:"latest"},(function(e,t){e?console.log("error",e):console.log("event",t)})),new Promise((function(e,t){d.eth.getAccounts().then((function(e){return v=e.slice(20,45)})).catch((function(e){t(e)}))})).then((function(e){var t;(t=e,new Promise((function(e,n){m.methods.REGISTRATION_FEE().call().then((function(s){for(var c=function(e){m.methods.registerOracle().send({from:t[e],value:s,gas:4e6,gasPrice:3e7}).then((function(){m.methods.getMyIndexes().call({from:t[e]}).then((function(e){A.push(e)})).catch((function(e){n(e)}))})).catch((function(e){n(e)}))},o=0;o<25;o++)c(o);e(A)})).catch((function(e){n(e)}))}))).catch((function(e){console.log(e.message)}))})),g.get("/api",(function(e,t){t.send({message:"An API for use with your Dapp!"})})),g.get("/api/status/:status",(function(e,t){var n="Status changed, ";switch(e.params.status){case"10":E=b,n=n.concat("ON TIME");break;case"20":E=20,n=n.concat("LATE AIRLINE");break;case"30":E=30,n=n.concat("LATE WEATHER");break;case"40":E=40,n=n.concat("LATE TECHNICAL");break;case"50":E=50,n=n.concat("LATE OTHER");break;default:E=0,n=n.concat("UNKNOWN")}t.send({message:n})})),g.listen(80,(function(){console.log("app listening on port",80)})),t.default=g}};