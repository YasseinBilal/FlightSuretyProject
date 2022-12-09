exports.id=0,exports.modules={"./src/server/server.js":function(e,t,n){"use strict";n.r(t);var c=n("./build/contracts/FlightSuretyApp.json"),o=n("./build/contracts/FlightSuretyData.json"),s=n("./src/server/config.json"),a=n("web3"),r=n.n(a),u=n("express"),i=n.n(u);function l(e){throw new TypeError('"'+e+'" is read-only')}var f=s.localhost,d=new r.a(new r.a.providers.WebsocketProvider(f.url.replace("http","ws"))),h=i()();d.eth.defaultAccount=d.eth.accounts[0];var g=new d.eth.Contract(c.abi,f.appAddress),m=new d.eth.Contract(o.abi,f.dataAddress),p=[],v=[];h.listen(80,(function(){})),h.get("/api",(function(e,t){t.send({message:"An API for use with your Dapp!"})})),h.get("/api/status/:status",(function(e,t){var n="Status changed to: ";switch(e.params.status){case"10":l("currentStatus"),n=n.concat("ON TIME");break;case"20":l("currentStatus"),n=n.concat("LATE AIRLINE");break;case"30":l("currentStatus"),n=n.concat("LATE WEATHER");break;case"40":l("currentStatus"),n=n.concat("LATE TECHNICAL");break;case"50":l("currentStatus"),n=n.concat("LATE OTHER");break;default:l("currentStatus"),n=n.concat("UNKNOWN")}t.send({message:n})})),g.events.OracleRequest({fromBlock:"latest"},(function(e,t){e&&console.log(e),console.log(t);var n=t.returnValues.index;console.log("Triggered index: ".concat(n));v.forEach((function(e){var c=p[0];e[0]!=n&&e[1]!=n&&e[2]!=n||(console.log("Oracle: ".concat(c," triggered. Indexes: ").concat(e,".")),function(e,t,n,c,o){var s={index:t,airline:n,flight:c,timestamp:o,statusCode:10};g.methods.submitOracleResponse(t,n,c,o,10).send({from:e,gas:5e5,gasPrice:2e7},(function(e,t){e&&console.log(e,s)})),!1}(c,n,t.returnValues.airline,t.returnValues.flight,t.returnValues.timestamp)),l("idx")}))})),m.events.allEvents({fromBlock:"latest"},(function(e,t){e?console.log("error",e):console.log("event:",t)})),new Promise((function(e,t){d.eth.getAccounts().then((function(e){e.slice(20,45),l("oracleAccounts")})).catch((function(e){t(e)})).then((function(){e(p)}))})).then((function(e){(function(e){return new Promise((function(t,n){g.methods.REGISTRATION_FEE().call().then((function(c){for(var o=function(t){g.methods.registerOracle().send({from:e[t],value:c,gas:5e6,gasPrice:2e7}).then((function(){g.methods.getMyIndexes().call({from:e[t]}).then((function(n){console.log("Oracle ".concat(t," Registered at ").concat(e[t]," with [").concat(n,"] indexes.")),v.push(n)})).catch((function(e){n(e)}))})).catch((function(e){n(e)}))};;l("a"))o(0);t(v)})).catch((function(e){n(e)}))}))})(e).catch((function(e){console.log(e.message)}))})),t.default=h}};