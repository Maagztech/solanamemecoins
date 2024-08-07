const express = require('express');
const { VersionedTransaction, Connection, Keypair } = require('@solana/web3.js');
const bs58 = require("bs58");
const axios = require('axios');
const app = express();
const port = 3000;

// Import the database connection
const db = require('./database');

// Middleware to parse JSON
app.use(express.json());

// Import and use the routes from another file
const apiRoutes = require('./apiRoutes.js');
app.use('/api', apiRoutes);



const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const web3Connection = new Connection(
    RPC_ENDPOINT,
    'confirmed',
);


const sendPortalTransaction = async () => {
    try {
        const response = await axios.post(`https://pumpportal.fun/api/trade-local`, {
            "publicKey": "AyKjYMWvXBJBQGnHqZaDQV39Kk1sfNPGaozJ2TXtAyUd",  // Your wallet public key
            "action": "buy",                 // "buy" or "sell"
            "mint": "8Xbq9yuEDdNCNx7fSB6SpN9HZy17btzWQ8TNxAnxpump",         // contract address of the token you want to trade
            "denominatedInSol": "false",     // "true" if amount is amount of SOL, "false" if amount is number of tokens
            "amount": 10,                  // amount of SOL or tokens
            "slippage": 1,                   // percent slippage allowed
            "priorityFee": 0.00001,          // priority fee
            "pool": "pump"                   // exchange to trade on. "pump" or "raydium"
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.status === 200) { // successfully generated transaction
            const data = response.data;
            console.log('Received transaction data:', data);

            try {
                const tx = VersionedTransaction.deserialize(new Uint8Array(data));
                const signerKeyPair = Keypair.fromSecretKey(bs58.decode("2Z47558YtZ8kNSUFtM3Lg1DYuX5gqiCPtzNUnDfYTHnNDaVBm6xub9ane6vFdxruar2FzRCXbvoX5HpcHdqAYc1f"));
                tx.sign([signerKeyPair]);
                const signature = await web3Connection.sendTransaction(tx);
                console.log("Transaction: https://solscan.io/tx/" + signature);
            } catch (deserializationError) {
                console.error('Failed to deserialize transaction:', deserializationError);
            }

        } else {
            console.log(response.statusText); // log error
        }
    } catch (error) {
        console.error(error);
    }
}

// sendPortalTransaction();

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});