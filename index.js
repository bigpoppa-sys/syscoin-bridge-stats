var express = require("express");
var app = express();
var axios = require('axios');
var cors = require('cors');
var bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const options = {
    host: 'localhost',
    port: 8000,
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert'),
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
};
var httpsServer = https.createServer(options, app);

app.use(cors({origin:"*",optionsSuccessStatus: 200}))
app.use(bodyParser.json())

let gasLow = 0;
let gasAvg = 0;
let gasFast = 0;
let ethUsd = 0;
let ethBtc = 0;
let sysUsd = 0;
let sysBtc = 0;

function calcs(){ 
    let gasLimit = 21000;
    let bigNr = 10000000000;
    let gasLowCal = gasLow/bigNr*gasLimit*ethUsd;
    let gasAvgCal = gasAvg/bigNr*gasLimit*ethUsd;
    let gasFastCal = gasFast/bigNr*gasLimit*ethUsd;
    let one = 5000;
    let two = 25000;
    let three = 100000;
    let four = 500000;
    let five = 1000000;
    let six = 10000000;
    let sysSpt = 0.0001; // need to make this dynamic
    let sysTxUsd = sysUsd*sysSpt;

    return{

        eth_price:{
                usd: Number(ethUsd).toFixed(2),
                btc: Number(ethBtc).toFixed(8)
        },

        gas_price:{
            gwei:{
                fast: (Number(gasFast)/10).toFixed(2),
                std: (Number(gasAvg)/10).toFixed(2),
                low: (Number(gasLow)/10).toFixed(2)
            },
            usd:{
                fast: Number(gasFastCal).toFixed(4),
                std: Number(gasAvgCal).toFixed(4),
                low: Number(gasLowCal).toFixed(4)
            }
        },

        eth_tx_costs:{
            low: {
                'five_k': (Number(gasLowCal)*one).toFixed(2),
                'twenty_five_k': (Number(gasLowCal)*two).toFixed(2),
                'one_hundred_k': (Number(gasLowCal)*three).toFixed(2),
                'five_hundred_k': (Number(gasLowCal)*four).toFixed(2),
                'one_mil': (Number(gasLowCal)*five).toFixed(2),
                'ten_mil': (Number(gasLowCal)*six).toFixed(2)  
            },

            std: {
                'five_k': (Number(gasAvgCal)*one).toFixed(2),
                'twenty_five_k': (Number(gasAvgCal)*two).toFixed(2),
                'one_hundred_k': (Number(gasAvgCal)*three).toFixed(2),
                'five_hundred_k': (Number(gasAvgCal)*four).toFixed(2),
                'one_mil': (Number(gasAvgCal)*five).toFixed(2),
                'ten_mil': (Number(gasAvgCal)*six).toFixed(2)
            },

            fast: {
                'five_k': (Number(gasFastCal)*one).toFixed(2),
                'twenty_five_k': (Number(gasFastCal)*two).toFixed(2),
                'one_hundred_k': (Number(gasFastCal)*three).toFixed(2),
                'five_hundred_k': (Number(gasFastCal)*four).toFixed(2),
                'one_mil': (Number(gasFastCal)*five).toFixed(2),
                'ten_mil': (Number(gasFastCal)*six).toFixed(2)
            }
        },

        sys_price:{
                usd: Number(sysUsd).toFixed(4),
                btc: Number(sysBtc).toFixed(8)
        },

        spt_cost:{
                usd: Number(sysTxUsd).toFixed(8),
                sys: Number(sysSpt).toFixed(8),
        },
        
        spt_tx_cost: {
                'five_k': (Number(sysTxUsd)*one).toFixed(2),
                'twenty_five_k': (Number(sysTxUsd)*two).toFixed(2),
                'one_hundred_k': (Number(sysTxUsd)*three).toFixed(2),
                'five_hundred_k': (Number(sysTxUsd)*four).toFixed(2),
                'one_mil': (Number(sysTxUsd)*five).toFixed(2),
                'ten_mil': (Number(sysTxUsd)*six).toFixed(2)  
            }
    }
}

setInterval(async function statInfo(){

    // Get Data for wei
    let gasData = await axios.get('https://ethgasstation.info/api/ethgasAPI.json').catch((err)=>console.log(err))
    gasLow = gasData.data.safeLow;
    gasFast = gasData.data.fast;
    gasAvg = gasData.data.average;

    // Get Pricing for Ethereum
    let geckoEth = await axios.get('https://api.coingecko.com/api/v3/coins/ethereum?tickers=true&market_data=true').catch((err)=>console.log(err))
    ethUsd = geckoEth.data.market_data.current_price.usd;
    ethBtc = geckoEth.data.market_data.current_price.btc;

    // Get Pricing for Syscoin
    let geckoSys = await axios.get('https://api.coingecko.com/api/v3/coins/syscoin?tickers=true&market_data=true').catch((err)=>console.log(err))
    sysUsd = geckoSys.data.market_data.current_price.usd;
    sysBtc = geckoSys.data.market_data.current_price.btc;

},20000) // Checks every 20 secs

app.get('/stats',(req,res)=>{
  res.status(200).send(calcs())
})

httpsServer.listen(8000, () => {
    console.log("Bridge Stats now live");
    console.log("View at https://localhost:8000/stats")
})