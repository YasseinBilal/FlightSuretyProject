exports.id=0,exports.modules={"./src/server/server.js":function(e,t,n){"use strict";n.r(t);var c=n("./build/contracts/FlightSuretyApp.json"),s=n("./build/contracts/FlightSuretyData.json"),o=n("./src/server/config.json"),r=n("web3"),a=n.n(r),u=n("express"),i=n.n(u);function l(e){throw new TypeError('"'+e+'" is read-only')}var f=o.localhost,h=new a.a(new a.a.providers.WebsocketProvider(f.url.replace("http","ws"))),d=i()();h.eth.defaultAccount=h.eth.accounts[0];var g=new h.eth.Contract(c.abi,f.appAddress),m=new h.eth.Contract(s.abi,f.dataAddress),p=[],v=[],A=E,E=10;g.events.OracleRequest({fromBlock:"latest"},(function(e,t){var n=t.returnValues.index,c=0;v.forEach((function(e){var s=p[c];e[0]!=n&&e[1]!=n&&e[2]!=n||function(e,t,n,c,s){var o={index:t,airline:n,flight:c,timestamp:s,statusCode:A};g.methods.submitOracleResponse(t,n,c,s,A).send({from:e,gas:5e5,gasPrice:2e7}),20==A&&m.methods.creditInsurees(c).call({from:e},(function(e,t){e?console.log(e,o):console.log("Credit set for insurees")}))}(s,n,t.returnValues.airline,t.returnValues.flight,t.returnValues.timestamp),c++}))})),m.events.allEvents({fromBlock:"latest"},(function(e,t){e?console.log("error",e):console.log("event",t)})),new Promise((function(e,t){h.eth.getAccounts().then((function(e){e.slice(20,45),l("oracleAccounts")})).then((function(){e(p)})).catch((function(e){t(e)}))})).then((function(e){(function(e){return new Promise((function(t,n){g.methods.REGISTRATION_FEE().call().then((function(c){for(var s=function(t){g.methods.registerOracle().send({from:e[t],value:c,gas:5e6,gasPrice:2e7}).then((function(){g.methods.getMyIndexes().call({from:e[t]}).then((function(n){console.log("Oracle ".concat(t," Registered at ").concat(e[t]," with [").concat(n,"] indexes.")),v.push(n)})).catch((function(e){n(e)}))})).catch((function(e){n(e)}))};;l("a"))s(0);t(v)})).catch((function(e){n(e)}))}))})(e).catch((function(e){console.log(e.message)}))})),d.get("/api",(function(e,t){t.send({message:"An API for use with your Dapp!"})})),d.get("/api/status/:status",(function(e,t){var n="Status changed, ";switch(e.params.status){case"10":l("currentStatus"),n=n.concat("ON TIME");break;case"20":l("currentStatus"),n=n.concat("LATE AIRLINE");break;case"30":l("currentStatus"),n=n.concat("LATE WEATHER");break;case"40":l("currentStatus"),n=n.concat("LATE TECHNICAL");break;case"50":l("currentStatus"),n=n.concat("LATE OTHER");break;default:l("currentStatus"),n=n.concat("UNKNOWN")}t.send({message:n})})),d.listen(80,(function(){console.log("app listening on port",80)})),t.default=d}};