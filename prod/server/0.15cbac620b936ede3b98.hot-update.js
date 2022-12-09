exports.id=0,exports.modules={"./src/server/server.js":function(e,t,n){"use strict";n.r(t);var s=n("./build/contracts/FlightSuretyApp.json"),c=n("./build/contracts/FlightSuretyData.json"),r=n("./src/server/config.json"),a=n("web3"),o=n.n(a),u=n("express"),i=n.n(u);function l(e){throw new TypeError('"'+e+'" is read-only')}var f=r.localhost,h=new o.a(new o.a.providers.WebsocketProvider(f.url.replace("http","ws"))),d=i()();h.eth.defaultAccount=h.eth.accounts[0];var g=new h.eth.Contract(s.abi,f.appAddress),p=new h.eth.Contract(c.abi,f.dataAddress),m=[],v=[],A=E,E=10;g.events.OracleRequest({fromBlock:"latest"},(function(e,t){var n=t.returnValues.index,s=0;v.forEach((function(e){var c=m[s];e[0]!=n&&e[1]!=n&&e[2]!=n||function(e,t,n,s,c){g.methods.submitOracleResponse(t,n,s,c,A).send({from:e,gas:4e5,gasPrice:3e7}),20==A&&p.methods.creditInsurees(s).call({from:e})}(c,n,t.returnValues.airline,t.returnValues.flight,t.returnValues.timestamp),s++}))})),p.events.allEvents({fromBlock:"latest"},(function(e,t){e?console.log("error",e):console.log("event",t)})),new Promise((function(e,t){h.eth.getAccounts().then((function(e){return e.slice(20,45),l("oracleAccounts"),m})).catch((function(e){t(e)}))})).then((function(e){(function(e){return new Promise((function(t,n){g.methods.REGISTRATION_FEE().call().then((function(s){for(var c=function(t){g.methods.registerOracle().send({from:e[t],value:s,gas:4e6,gasPrice:3e7}).then((function(){g.methods.getMyIndexes().call({from:e[t]}).then((function(e){v.push(e)})).catch((function(e){n(e)}))})).catch((function(e){n(e)}))};;l("a"))c(0);t(v)})).catch((function(e){n(e)}))}))})(e).catch((function(e){console.log(e.message)}))})),d.get("/api",(function(e,t){t.send({message:"An API for use with your Dapp!"})})),d.get("/api/status/:status",(function(e,t){var n="Status changed, ";switch(e.params.status){case"10":l("currentStatus"),n=n.concat("ON TIME");break;case"20":l("currentStatus"),n=n.concat("LATE AIRLINE");break;case"30":l("currentStatus"),n=n.concat("LATE WEATHER");break;case"40":l("currentStatus"),n=n.concat("LATE TECHNICAL");break;case"50":l("currentStatus"),n=n.concat("LATE OTHER");break;default:l("currentStatus"),n=n.concat("UNKNOWN")}t.send({message:n})})),d.listen(80,(function(){console.log("app listening on port",80)})),t.default=d}};