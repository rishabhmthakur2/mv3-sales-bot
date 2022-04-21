const Web3 = require("web3");
const BN = require("bignumber.js");
const { readFile } = require("fs/promises");

// Handler imports
const {
  checkDataDuplicate,
  insertRecordToMongo,
} = require("./handlers/mongoHandler");
const { sendDiscordMessage } = require("./handlers/discordHandler");
const { sendTweet } = require("./handlers/twitterHandler");

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
      maxAttempts: 5,
      onTimeout: false,
    },
    clientConfig: {
      maxReceivedFrameSize: 1000000000000000,
      maxReceivedMessageSize: 1000000000000000,
    },
  };

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
      fromBlock: await web3.eth.getBlockNumber(), // Gets the latest block everytime when the app is started. Will start listening to events that occur after this Block.
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
      const typesArray = [
        { type: "bytes32", name: "buyHash" },
        { type: "bytes32", name: "sellHash" },
        { type: "uint256", name: "price" },
      ];
      txReceipt?.logs.forEach(async (log) => {
        if (
          log.topics[0] ===
            "0xc4109843e0b7d514e4c093114b863f8e7d8d9a458c372cd51bfe526b588006c9" &&
          log.topics[1]?.toLowerCase() ==
            web3.utils.padLeft(res.returnValues.from, 64).toLowerCase()
        ) {
          const decodedParameters = web3.eth.abi.decodeParameters(
            typesArray,
            log.data
          );
          const v = `${parseInt(decodedParameters.price)}`;
          const value = new BN(web3.utils.fromWei(v));
          if (value.gt(0)) {
            // Getting the Block of Transaction
            const block = await web3.eth.getBlock(res.blockNumber);
            // Creating a JSON that will hold all the data
            const message = {
              value: value.toFixed(), // Value of transaction
              to: res.returnValues.to, // NFT Transferred To (Buyer)
              from: res.returnValues.from, // NFT Transferred From (Seller)
              timestamp: block.timestamp, // Timestamp of the transaction (in UNIX)
              tokenId: res.returnValues.tokenId, // Token ID of the NFT transferred/Sold
              txHash: res.transactionHash,
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
                  message.from,
                  message.to,
                  message.timestamp,
                  message.txHash
                );
                if (!isDuplicate) {
                  const newRecord = await insertRecordToMongo(message);
                  console.log({
                    message: `Adding transaction to database with id: ${newRecord.insertedId.toString()}`,
                  });
                  try {
                    const tweetData = await sendTweet(message, tx.hash);
                    console.log({ tweetData });
                  } catch (e) {
                    console.error(e);
                  }
                  try {
                    const discordMessageData = await sendDiscordMessage(
                      myContract,
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
      });
    })
    .on("error", function (err, receipt) {
      console.log({ err });
    });
};

getEvents();
