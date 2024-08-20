'use strict';

module.exports = function (app) {
  const bcrypt = require("bcrypt");
  
  // ↑ ↑ ↑ SETTING UP HELMET ↑ ↑ ↑ 
  function retrieveStock(stock){ //UNUSED - DIDN'T WORK
    fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`)
            .then((response) => response.json())
            .then((data) => {
              // console.log("data:", data)
              res.json({stockData:{stock: data.symbol, price: data.latestPrice, likes: "IN PROGRESS"}})
            })
            .catch((err)=>{
              console.error(`1-STOCK ERROR: ${err}`)
            })
  }
  // ↓ ↓ ↓ M O N G O    S E T U P ↓ ↓ ↓
  let mongoose = require("mongoose")
  mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  // ↓ ↓ ↓ MONGO SCHEMAS ↓ ↓ ↓ 
  const stockSchema = new mongoose.Schema({
    symbol: {type: String, unique: true, required: true},
    likes: {type: Number, default: 0},
    ipsThatLikedIt : [String]
  })
  
  let Stock = mongoose.model("Stock", stockSchema)
  // FUNCTION FOR CREATING A STOCK DOCUMENT
  const createStock = (symbol) =>{ // DIDN'T USE IT
    new Stock({name: symbol}).save((err, savedStock)=>{
      if(err){console.error("Could not create stock in MongoDB: ", err)};
      console.log("savedStock: ", savedStock)
      res.json({stockData:{stock: data.symbol, price: data.latestPrice, likes: savedStock.likes}});
    })
  }
  // ↑ ↑ ↑ MONGO SCHEMAS ↑ ↑ ↑ 

  app.route('/api/stock-prices')
    .get(function (req, res){
    // ◘ I F   O N L Y   Q U E R Y I N G   O N E   S T O C K: ◘  
    // ◘ I F   O N L Y   Q U E R Y I N G   O N E   S T O C K: ◘  
      // if(typeof req.query.stock != "object" && !req.query.like){
      console.log(`req.query.stock: ${req.query.stock}\nreq.query.like: ${req.query.like}\nreq.ip: ${req.ip}`)
      if(typeof req.query.stock != "object"){
        // console.log("req.query.stock:",req.query.stock);
        let stock = req.query.stock;
        let symbol = "";
        let hashedIp = "";
        fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock}/quote`)
          .then((response) => response.json()) //DON'T ADD ANYTHING TO BODY, NOT EVEN CURLY BRACES
          .then((data) => {
            // CHECK IF STOCK DOESN'T EXIST IN API:
            if(!data.hasOwnProperty("symbol")){
              res.send("No such stock")
            }
            // IF STOCK EXISTS IN API
            else{
              // ◘ ◘ CHECK IF IT'S IN MONGO ◘ ◘ 
              symbol = data.symbol;
              console.log("symbol: ", symbol)
              console.log("Stock exists. Checking in MongoDB...")
              Stock.find({symbol: `${symbol}`}, (err, retrievedStock)=>{
                if(err){console.error(err); return};
                console.log("retrievedStock1: ", retrievedStock);
                // console.log("retrievedStock1[0].symbol: ", retrievedStock[0].symbol);

                // ◘ ◘ ◘ IF NOT IN MONGO and not liked, CREATE STOCK with 0 default likes ◘ ◘ ◘ 
                if(retrievedStock.length == 0 && !req.query.like){
                  console.log("retrievedStock2: ", retrievedStock)
                  console.log("Stock not found. Might need to create it with symbol: ", symbol);
                  new Stock({symbol: symbol}).save((err, savedStock)=>{
                    if(err){console.error("Could not create stock in MongoDB: ", err)};
                    console.log("savedStock: ", savedStock)
                    res.json({stockData:{stock: data.symbol, price: data.latestPrice, likes: 0}});
                    return // make sure it doesn't try to send the next res.json
                  })
                  
                }
                // ◘ ◘ ◘ IF NOT IN MONGO and YES liked, CREATE STOCK with 1 like and 1 IP ◘ ◘ ◘ 
                else if(retrievedStock.length == 0 && req.query.like){
                  console.log("retrievedStock2: ", retrievedStock)
                  console.log("Stock not found. Might need to create it with symbol: ", symbol);
                  // --- GET IP AND HASH IT ---
                  bcrypt.hash(req.ip, 10, (err, hashResult)=>{
                    if(err){console.log("Couldn't hash ip: ", err)}

                    new Stock({symbol: symbol, likes: 1, ipsThatLikedIt: [hashResult]}).save((err, savedStock)=>{
                      if(err){console.error("Could not create stock in MongoDB: ", err)};
                      console.log("savedStock: ", savedStock);
                      res.json({stockData:{stock: data.symbol, price: data.latestPrice, likes: savedStock.likes}});
                      return // make sure it doesn't try to send the next res.json
                    })
                    
                  })
                  // new Stock({symbol: symbol, likes: 1}).save((err, savedStock)=>{
                  //   if(err){console.error("Could not create stock in MongoDB: ", err)};
                  //   // done(null, savedStock)
                  //   console.log("savedStock: ", savedStock)
                  //   // GONNA NEED TO FIND THIS SAME STOCK AND PUSH THE HASHED IP INTO ipsThatLikedIt
                  // })
                  // res.json({stockData:{stock: data.symbol, price: data.latestPrice, likes: 0}});
                  // return // make sure it doesn't try to send the next res.json
                }
                // ◘ ◘ ◘ IF IT IS IN MONGO AND LIKE==FALSE ◘ ◘ ◘
                else if(retrievedStock[0].symbol == symbol && !req.query.like){
                  console.log("Stock in MongoDB. Retrieving without liking.")
                  res.json({stockData:{stock: symbol, price: data.latestPrice, likes: retrievedStock[0].likes}})
                }
                // ◘ ◘ ◘ IF IT IS IN MONGO AND LIKE==TRUE ◘ ◘ ◘
                else if(retrievedStock[0].symbol == symbol && req.query.like){
                  // IF STOCK HAS ZERO LIKES, THE ARRAY IS EMPTY
                  if(retrievedStock[0].ipsThatLikedIt.length == 0){
                    console.log("Stock exists but has no likes/IPs")
                    // HASH IP AND PUSH IT
                    bcrypt.hash(req.ip, 10, (err, hashResult)=>{
                      if(err){console.log("Couldn't hash ip: ", err)}
                      retrievedStock[0].ipsThatLikedIt.push(hashResult)
                      // ADD LIKE
                      retrievedStock[0].likes += 1
                      retrievedStock[0].save((err, updatedData)=>{
                        if(err){console.log("error while pushing IP", err)}
                        res.json({stockData:{stock: symbol, price: data.latestPrice, likes: retrievedStock[0].likes}})
                      })
                    })
                  }
                  else{// IF THE STOCK HAS 1>= LIKES
                    console.log("Stock in Mongo. Comparing IPs")
                    let comparisonFlag = false
                    console.log("req.ip: ", req.ip)
                    console.log("ipArray: ", retrievedStock[0].ipsThatLikedIt)
                    // COMPARE req.ip AGAINST EVERY HASH
                    for(let hash of retrievedStock[0].ipsThatLikedIt){
                      console.log("hash: ", hash);
                      comparisonFlag = bcrypt.compareSync(req["ip"], hash)
                      // IF A HASH MATCHES THE req.ip
                      if(comparisonFlag){
                        console.log("Can't like stock twice");
                        // RETRIEVE STOCK AS-IS
                        res.json({stockData:{stock: symbol, price: data.latestPrice, likes: retrievedStock[0].likes}})
                        break
                      }
                    }
                    // IF LOOP ENDS AND comparisonFlag IS STILL false
                    if( !comparisonFlag ){
                      // HASH IP AND PUSH IT
                      bcrypt.hash(req.ip, 10, (err, hashResult)=>{
                        if(err){console.log("Couldn't hash ip: ", err)}
                        retrievedStock[0].ipsThatLikedIt.push(hashResult)
                        // ADD LIKE
                        retrievedStock[0].likes += 1
                        // SAVE CHANGES
                        retrievedStock[0].save((err, updatedData)=>{
                          if(err){console.log("error while pushing IP", err)}
                          res.json({stockData:{stock: symbol, price: data.latestPrice, likes: retrievedStock[0].likes}})
                        })
                      })
                    }
                  }
                }
                
              })
            }})
          .catch((err)=>{
            console.error(`1-STOCK ERROR: ${err}`)
          })
      }
      // ◘ I F   Q U E R Y I N G   T W O   S T O C K S ◘
      // ◘ I F   Q U E R Y I N G   T W O   S T O C K S ◘
      else{ 
        let stock1 = req.query.stock[0];
        let stock2 = req.query.stock[1];
        let responseStock1 = "";
        let responseStock1InMongo = "";
        let responseStock2 = "";
        let responseStock2InMongo = "";
        fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock1}/quote`)
        .then((response) => response.json())
        .then( async (data) => {
          // CHECK IF STOCK DOESN'T EXIST IN API:
          if(!data.hasOwnProperty("symbol")){res.send(`Stock ${stock1} doesn't exist`); return}
          // IF IT EXISTS:
          responseStock1 = data;
          // --- THIS NEEDS TO BE CONDENSED ---
          // --- THIS NEEDS TO BE CONDENSED ---
          // ◘ ◘ CHECK IF IT'S IN MONGO ◘ ◘ 
          // console.log(data)
          let symbol = data.symbol;
          let retrievedStock = ""
          console.log("1) 1 symbol: ", symbol)
          console.log("2) 1 Stock exists. Checking in MongoDB...")
          retrievedStock = await Stock.find({symbol: `${symbol}`})
          console.log("3) 1 retrievedStock1: ", retrievedStock);

          // ◘ ◘ IF NOT IN MONGO and not liked, CREATE STOCK with 0 default likes ◘ ◘
          if(retrievedStock.length == 0 && !req.query.like){
            console.log("4) 1 Stock not found. Might need to create it with symbol: ", symbol);

            responseStock1InMongo = await new Stock({symbol: symbol}).save();
            console.log("5) 1 Created stock: ", responseStock1InMongo)
          }
          // ◘ ◘ IF NOT IN MONGO and YES liked, CREATE STOCK with 1 like and 1 IP ◘ ◘ 
          else if(retrievedStock.length == 0 && req.query.like){
            console.log("4) 1 Stock not found. Might need to create it with symbol: ", symbol);
            // --- GET IP AND HASH IT ---
            console.log("5) 1 Hashing ip")
            let hashResult = await bcrypt.hash(req.ip, 10)

            responseStock1InMongo = await new Stock({symbol: symbol, likes: 1, ipsThatLikedIt: [hashResult]}).save()
            console.log("6) 1 Created stock: ", responseStock1InMongo);
          }
          // ◘ ◘ IF IT IS IN MONGO AND LIKE==FALSE ◘ ◘
          else if(retrievedStock[0].symbol == symbol && !req.query.like){
            console.log("4) 1 Stock in MongoDB. Retrieving without liking.");
            responseStock1InMongo = retrievedStock[0];
            console.log("5) responseStock1InMongo.symbol: ", responseStock1InMongo.symbol)
          }
          // ◘ ◘ IF IT IS IN MONGO AND LIKE==TRUE ◘ ◘
          else if(retrievedStock[0].symbol == symbol && req.query.like){
            responseStock1InMongo = retrievedStock[0];
            // IF STOCK HAS ZERO LIKES, THE ARRAY IS EMPTY
            console.log("4) 1 Stock in Mongo. Liking and retrieving" )
            if(retrievedStock[0].ipsThatLikedIt.length == 0){
              console.log("5) 1 Stock in Mongo but has no likes/IPs")
              // HASH IP AND PUSH IT
              let hashResult = await bcrypt.hash(req.ip, 10)
              console.log("6) 1 Hashing ip")
              // PUSH IP AND ADD LIKE
              retrievedStock[0].ipsThatLikedIt.push(hashResult)
              retrievedStock[0].likes += 1
              console.log("7) 1 Updating in mongo")
              responseStock1InMongo = await retrievedStock[0].save()
            }
            else{// IF THE STOCK HAS 1>= LIKES
              console.log("5) 1 Stock in Mongo and it has likes. Comparing IPs")
              let comparisonFlag = false
              console.log("req.ip: ", req.ip)
              console.log("ipArray: ", retrievedStock[0].ipsThatLikedIt)
              // COMPARE req.ip AGAINST EVERY HASH
              for(let hash of retrievedStock[0].ipsThatLikedIt){
                console.log("hash: ", hash);
                comparisonFlag = bcrypt.compareSync(req["ip"], hash)
                // IF A HASH MATCHES THE req.ip
                if(comparisonFlag){
                  console.log("6) 1 Can't like stock twice");
                  // RETRIEVE STOCK AS-IS
                  // res.json({stockData:{stock: symbol, price: data.latestPrice, likes: retrievedStock[0].likes}})
                  break
                }
              }
              // IF LOOP ENDS AND comparisonFlag IS STILL false
              if( !comparisonFlag ){
                // HASH IP AND PUSH IT
                console.log("6) 1 Stock can be liked by this ip. Hashing)")
                let hashResult = await bcrypt.hash(req.ip, 10)
                console.log("7) 1 Hashing ip")
                // PUSH IP AND ADD LIKE
                retrievedStock[0].ipsThatLikedIt.push(hashResult)
                retrievedStock[0].likes += 1
                console.log("8) 1 Updating in mongo")
                responseStock1InMongo = await retrievedStock[0].save()
              }
            }
          }
        return fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stock2}/quote`)
        })
        // .catch((err)=>{
        //   console.error(`2-STOCK Error1!: ${err}`)
        // })
        // })
        .then((response) => response.json())
        .then( async (data) => {
          // CHECK IF STOCK DOESN'T EXIST IN API:
          if(!data.hasOwnProperty("symbol")){res.send(`Stock ${stock2} doesn't exist`); return}
          // IF IT EXISTS:
          responseStock2 = data;
          // --- THIS NEEDS TO BE CONDENSED ---
          // --- THIS NEEDS TO BE CONDENSED ---
          // ◘ ◘ CHECK IF IT'S IN MONGO ◘ ◘ 
          let symbol = data.symbol;
          let retrievedStock = ""
          console.log("1) 2 symbol: ", symbol)
          console.log("2) 2 Stock exists. Checking in MongoDB...")
          
          retrievedStock = await Stock.find({symbol: `${symbol}`})
          console.log("3) 2 retrievedStock2: ", retrievedStock);
          // ◘ ◘ ◘ IF NOT IN MONGO and not liked, CREATE STOCK with 0 default likes ◘ ◘ ◘ 
          if(retrievedStock.length == 0 && !req.query.like){
            console.log("4) 2 Stock not found. Might need to create it with symbol: ", symbol);
            // createStock(data.symbol, done); //DIDN'T WORK
            responseStock2InMongo = await new Stock({symbol: symbol}).save();
            console.log("5) 2 Created stock: ", responseStock2InMongo)
          }
          // ◘ ◘ ◘ IF NOT IN MONGO and YES liked, CREATE STOCK with 1 like and 1 IP ◘ ◘ ◘ 
          else if(retrievedStock.length == 0 && req.query.like){
            console.log("4) 2 Stock not found. Might need to create it with symbol: ", symbol);
            // --- GET IP AND HASH IT ---
            console.log("5) 2 Hashing ip")
            let hashResult = await bcrypt.hash(req.ip, 10)

            responseStock2InMongo = await new Stock({symbol: symbol, likes: 1, ipsThatLikedIt: [hashResult]}).save()
            console.log("6) 2 Created stock: ", responseStock2InMongo);
          }
          // ◘ ◘ ◘ IF IT IS IN MONGO AND LIKE==FALSE ◘ ◘ ◘
          else if(retrievedStock[0].symbol == symbol && !req.query.like){
            console.log("4) 2 Stock in MongoDB. Retrieving without liking.");
            responseStock2InMongo = retrievedStock[0];
            console.log("5) responseStock2InMongo.symbol: ", responseStock2InMongo.symbol) 
          }
          // ◘ ◘ ◘ IF IT IS IN MONGO AND LIKE==TRUE ◘ ◘ ◘
          else if(retrievedStock[0].symbol == symbol && req.query.like){
            // IF STOCK HAS ZERO LIKES, THE ARRAY IS EMPTY
            console.log("4) 2 Stock in Mongo. Liking and retrieving" )
            responseStock2InMongo = retrievedStock[0];
            if(retrievedStock[0].ipsThatLikedIt.length == 0){
              console.log("5) 2 Stock in Mongo but has no likes/IPs")
              // HASH IP AND PUSH IT
              let hashResult = await bcrypt.hash(req.ip, 10)
              console.log("6) 2 Hashing ip")
              // PUSH IP AND ADD LIKE
              retrievedStock[0].ipsThatLikedIt.push(hashResult)
              retrievedStock[0].likes += 1
              console.log("7) 2 Updating in mongo")
              responseStock2InMongo = await retrievedStock[0].save()
            }
            else{// IF THE STOCK HAS 1>= LIKES
              console.log("5) 2 Stock in Mongo and it has likes. Comparing IPs")
              let comparisonFlag = false
              console.log("req.ip: ", req.ip)
              console.log("ipArray: ", retrievedStock[0].ipsThatLikedIt)
              // COMPARE req.ip AGAINST EVERY HASH
              for(let hash of retrievedStock[0].ipsThatLikedIt){
                console.log("hash: ", hash);
                comparisonFlag = bcrypt.compareSync(req["ip"], hash)
                // IF A HASH MATCHES THE req.ip
                if(comparisonFlag){
                  console.log("6) 2 Can't like stock twice");
                  break
                }
              }
              // IF LOOP ENDS AND comparisonFlag IS STILL false
              if( !comparisonFlag ){
                // HASH IP AND PUSH IT
                console.log("6) 2 Stock can be liked by this ip. Hashing)")
                let hashResult = await bcrypt.hash(req.ip, 10)
                console.log("7) 2 Hashing ip")
                // PUSH IP AND ADD LIKE
                retrievedStock[0].ipsThatLikedIt.push(hashResult)
                retrievedStock[0].likes += 1
                console.log("8) 2 Updating in mongo")
                responseStock2InMongo = await retrievedStock[0].save()
              }
            }
          }
          console.log("◘ SENDING JSON ◘")
          res.json({stockData:[{stock: responseStock1.symbol, price: responseStock1.latestPrice, rel_likes: responseStock1InMongo.likes - responseStock2InMongo.likes},{stock: responseStock2.symbol, price: responseStock2.latestPrice, rel_likes: responseStock2InMongo.likes - responseStock1InMongo.likes }]})
          console.log("◘ JSON SENT ◘")
        })
        .catch((err)=>{
          console.error(`2-STOCK Error2!: ${err}`)
        })
      }
    });  
};
