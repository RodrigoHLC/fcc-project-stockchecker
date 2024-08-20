const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    test("Viewing one stock: GET request to /api/stock-prices/", function(done){
        chai
        .request(server)
        .keepOpen()
        .get("/api/stock-prices?stock=GOOG")
        .end((err, res)=>{
            if(err){console.error(err)}
            assert.equal(res.status, 200, "Status must be 200")
            assert.isObject(res.body, "response must be an object")
            assert.property(res.body, "stockData", "'stockData' must be a property")
            assert.property(res.body.stockData, "stock", "'stock' must be a property")
            assert.property(res.body.stockData, "price", "'price' must be a property")
            assert.property(res.body.stockData, "likes", "'likes' must be a property")
            assert.isString(res.body.stockData.stock, "'stock' must be a string")
            assert.typeOf(res.body.stockData.price, "number", "'price' must be of type 'number'")
            assert.isNumber(res.body.stockData.likes, "likes' must be of type 'number'")
            assert.isAtLeast(res.body.stockData.likes, 0, "likes must be at least 0")
            assert.equal(res.body.stockData.stock, "GOOG")
            done()
        })
    })
    test("Viewing one stock and liking it: GET request to /api/stock-prices/", (done)=>{
        chai
        .request(server)
        .keepOpen()
        .get("/api/stock-prices?stock=msFt")
        .end((err, res)=>{
            assert.equal(res.status, 200, "Status should be 200")
            assert.isObject(res.body, "Response should be an object")
            assert.property(res.body, "stockData", "stockData should be a property")
            assert.equal(res.body.stockData.stock, "MSFT")
            assert.isString(res.body.stockData.stock)
            assert.isNumber(res.body.stockData.price)
            assert.isNumber(res.body.stockData.likes)
            assert.isAtLeast(res.body.stockData.likes, 1)
            done()
        })
    })
    // THIS TEST REQUIRES LIKING A STOCK BEFORE RUNNING THE TEST, AND THE COMPARING THE RESULT OF THE TEST TO THE RESULT OF THE PREVIOUS LIKE
    let numberOfLikes= ""
    before((done)=>{
        chai
        .request(server)
        .keepOpen()
        .get("/api/stock-prices?stock=NFLX&like=true")
        .end((err,res)=>{
            if(err){console.error(err)}
            numberOfLikes = res.body.stockData.likes
            // ↑ ↑ ↑ THIS VAR SHOULD REMAIN UNCHANGED AFTER THE FOLLOWING TEST
            done()
        })
    })
    test("Viewing the same stock and liking it again: GET request to /api/stock-prices/", (done)=>{
        chai
        .request(server)
        .keepOpen()
        .get("/api/stock-prices?stock=nflx&like=true")
        .end((err, res)=>{
            if(err){console.error(err)}
            assert.equal(res.status, 200)
            assert.equal(res.body.stockData.likes, numberOfLikes, `Responses number of likes should be the same as the number of likes from the previous request, stored in numberOfLikes=${numberOfLikes}`)
            done()
        })
    })
test("Viewing two stocks: GET request to /api/stock-prices/", (done)=>{
    chai
    .request(server)
    .keepOpen()
    .get("/api/stock-prices?stock=goog&stock=msft")
    .end((err,res)=>{
        if(err){console.error(err)}
        assert.equal(res.status, 200)
        assert.isObject(res.body, "response should be an array")
        assert.isArray(res.body.stockData, "response should be an array")
        assert.equal(res.body.stockData.length, 2)
        assert.isString(res.body.stockData[0].stock)
        assert.isNumber(res.body.stockData[0].price)
        assert.isNumber(res.body.stockData[0].rel_likes)
        assert.isString(res.body.stockData[1].stock)
        assert.isNumber(res.body.stockData[1].price)
        assert.isNumber(res.body.stockData[1].rel_likes)
        done()
    })
})
// THIS TEST REQUIRES GETTING THE LIKE COUNT FOR EACH STOCK INDIVIDUALLY IN ORDER TO COMPARE THEM
let tslaLikes= "";
let nflxLikes= "";
before((done)=>{
    chai
    .request(server)
    .keepOpen()
    .get("/api/stock-prices?stock=tsla")
    .end((err, res)=>{
        if(err){console.error(err)}
        tslaLikes = res.body.stockData.likes // ◘ ◘
        console.log("tslaLikes: ", tslaLikes)
        // done()
    })
    chai
    .request(server)
    .keepOpen()
    .get("/api/stock-prices?stock=nflx")
    .end((err, res)=>{
        if(err){console.error(err)}
        nflxLikes = res.body.stockData.likes // ◘ ◘
        console.log("nflxLikes: ", nflxLikes)
        done()
    })
})
test("Viewing two stocks and liking them: GET request to /api/stock-prices/", (done)=>{
    chai
    .request(server)
    .keepOpen()
    .get("/api/stock-prices?stock=tsla&stock=nflx&like=true")
    .end((err, res)=>{
        assert.equal(res.status, 200)
        assert.isObject(res.body, "Response should be an object")
        assert.isArray(res.body.stockData, "Response.stockData should be an array")
        assert.equal(res.body.stockData.length, 2)
        assert.equal(res.body.stockData[0].stock, "TSLA")
        assert.isNumber(res.body.stockData[0].price)
        assert.equal(res.body.stockData[0].rel_likes, tslaLikes-nflxLikes)

        assert.equal(res.body.stockData[1].stock, "NFLX")
        assert.isNumber(res.body.stockData[0].price)
        assert.equal(res.body.stockData[0].rel_likes, nflxLikes-tslaLikes)
        done()
    })
})

});
