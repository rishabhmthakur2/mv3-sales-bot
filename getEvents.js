const Web3 = require("web3");
const BN = require("bignumber.js");
const { readFile } = require("fs/promises");

// Handler imports
const {
  checkDataDuplicate,
  insertRecordToMongo,
  getConnection,
} = require("./handlers/mongoHandler");
const { sendDiscordMessage } = require("./handlers/discordHandler");
const { sendTweet } = require("./handlers/twitterHandler");

// Util imports
const { fetchMetadata } = require("./utils/metadata");

// Environment file used to host API keys
const dotenv = require("dotenv");
require("dotenv").config();

// Setting up the WETH Address. Will be used later to check if a transaction was paid using WETH instead of ETH
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2".toLowerCase();

let getEvents = async () => {
  // Connection options for the Web3 Event Listener
  const options = {
    // Enable auto reconnection
    reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5000,
      onTimeout: false,
    },
    clientConfig: {
      maxReceivedFrameSize: 1000000000000000000000,
      maxReceivedMessageSize: 1000000000000000000000,
    },
  };

  const mongoClient = await getConnection();

  // Setting Infura as the Web Provider
  const web3 = new Web3(process.env.WEB3_PROVIDER);
  web3.setProvider(
    new Web3.providers.WebsocketProvider(
      process.env.WEB3_SOCKET_PROVIDER,
      options
    )
  );

  const abi = JSON.parse(await readFile("./utils/contractABI.json"));
  // Initializing the contract with Web3 using ABI for ERC721A
  // Contract address for MV3
  const myContract = await new web3.eth.Contract(
    abi,
    process.env.CONTRACT_ADDRESS
  );

  // Listening for "Transfer" event
  myContract.events
    .Transfer({
      fromBlock: 14965684, //await web3.eth.getBlockNumber(), // Gets the latest block everytime when the app is started. Will start listening to events that occur after this Block.
    })
    .on("connected", function (subscriptionId) {
      console.log({ subscriptionId });
    })
    .on("data", async function (res) {
      // Getting the Transaction Hash and Receipt
      const tx = await web3.eth.getTransaction(res.transactionHash);
      const txReceipt = await web3.eth.getTransactionReceipt(
        res.transactionHash
      );
      // Updated Types Array for SeaPort OS Port
      const typesArray = [
        { type: "bytes32", name: "hash" },
        { type: "address", name: "buyerAddress" },
        { type: "uint256", name: "f1" },
        { type: "uint256", name: "f2" },
        { type: "uint256", name: "f3" },
        { type: "uint256", name: "f4" },
        { type: "address", name: "contractAddress" },
        { type: "uint256", name: "tokenID" },
        { type: "uint256", name: "f5" },
        { type: "uint256", name: "f6" },
        { type: "uint256", name: "f7" },
        { type: "uint256", name: "f8" },
        { type: "uint256", name: "f9" },
        { type: "uint256", name: "payoutOne" },
        { type: "address", name: "sellerAddress" },
        { type: "uint256", name: "f10" },
        { type: "uint256", name: "f11" },
        { type: "uint256", name: "f12" },
        { type: "uint256", name: "payoutTwo" },
        { type: "address", name: "openseaWallet" },
        { type: "uint256", name: "f13" },
        { type: "uint256", name: "f14" },
        { type: "uint256", name: "f15" },
        { type: "uint256", name: "payoutThree" },
        { type: "address", name: "commissionWallet" },
      ];
      txReceipt?.logs.forEach(async (log) => {
        if (
          // Topic specifically for OS as of now - Needs to be changed
          log.topics[0] ===
          "0x9d9af8e38d66c62e2c12f0225249fd9d721c54b83f48d9352c97c6cacdcb6f31"
        ) {
          const { ...decodedParameters } = web3.eth.abi.decodeParameters(
            typesArray,
            log.data
          );
          if (
            decodedParameters.sellerAddress == res.returnValues.from &&
            decodedParameters.buyerAddress == res.returnValues.to
          ) {
            const totalPrice =
              parseInt(decodedParameters.payoutOne) +
              parseInt(decodedParameters.payoutTwo) +
              parseInt(decodedParameters.payoutThree);
            const v = `${parseInt(totalPrice)}`;
            const value = new BN(web3.utils.fromWei(v));
            if (value.gt(0)) {
              // Getting the Block of Transaction
              const block = await web3.eth.getBlock(res.blockNumber);
              // Creating a JSON that will hold all the data
              let message = {
                value: value.toFixed(), // Value of transaction
                to: res.returnValues.to, // NFT Transferred To (Buyer)
                from: res.returnValues.from, // NFT Transferred From (Seller)
                timestamp: block.timestamp, // Timestamp of the transaction (in UNIX)
                tokenId: res.returnValues.tokenId, // Token ID of the NFT transferred/Sold
                txHash: res.transactionHash, // Transaction Hash
              };

              // Checking if the transfer was a mint or a sale
              if (
                res.returnValues.from !=
                  "0x0000000000000000000000000000000000000000" &&
                parseFloat(value.toFixed()) > 0
              ) {
                // Consoling the Message Block generate above
                console.log({ message });
                try {
                  const isDuplicate = await checkDataDuplicate(
                    mongoClient,
                    message.from,
                    message.to,
                    message.timestamp,
                    message.txHash
                  );
                  if (!isDuplicate) {
                    const newRecord = await insertRecordToMongo(
                      mongoClient,
                      message
                    );
                    console.log({
                      message: `Adding transaction to database with id: ${newRecord.insertedId.toString()}`,
                    });
                    const uri = await myContract.methods
                      .tokenURI(message.tokenId)
                      .call();
                    const metadata = await fetchMetadata(uri);
                    message = {
                      ...message,
                      name: metadata.name,
                      image: metadata.image,
                    };
                    try {
                      const tweetData = await sendTweet(message);
                      console.log({ tweetData });
                    } catch (e) {
                      console.error(e);
                    }
                    try {
                      const discordMessageData = await sendDiscordMessage(
                        message
                      );
                      console.log({ discordMessageData });
                    } catch (e) {
                      console.error(e);
                    }
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }
          }
        }
      });
    })
    .on("error", function (err, receipt) {
      console.log({ err });
    });
};

module.exports = { getEvents };
