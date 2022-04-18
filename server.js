const { TwitterApi } = require("twitter-api-v2");
const Web3 = require("web3");
const axios = require("axios");
const BN = require("bignumber.js");
const fs = require("fs");
const { MongoClient, ServerApiVersion } = require("mongodb");
// const { getEthToUSDPrice } = require("./utils/ethPrice");
const { createMessage, discordSetup } = require("./utils/discord");
const { fetchMetadata } = require("./utils/metadata");

// Environment file used to host API keys
const dotenv = require("dotenv");
require("dotenv").config();

// Setting up connection config for MongoDB
const uri = process.env.MONGO_URL;
const mongoClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Setting up Twitter's Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWTR_API_KEY,
  appSecret: process.env.TWTR_API_KEY_SECRET,
  accessToken: process.env.TWTR_ACCESS_TOKEN,
  accessSecret: process.env.TWTR_ACCESS_TOKEN_SECRET,
});

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

  // Initializing the contract with Web3 using ABI for ERC721A
  // Contract address for MV3
  const myContract = await new web3.eth.Contract(
    [
      {
        inputs: [
          { internalType: "uint256", name: "collectionSize_", type: "uint256" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      { inputs: [], name: "ApprovalCallerNotOwnerNorApproved", type: "error" },
      { inputs: [], name: "ApprovalQueryForNonexistentToken", type: "error" },
      { inputs: [], name: "ApprovalToCurrentOwner", type: "error" },
      { inputs: [], name: "ApproveToCaller", type: "error" },
      { inputs: [], name: "BalanceQueryForZeroAddress", type: "error" },
      { inputs: [], name: "MintToZeroAddress", type: "error" },
      { inputs: [], name: "MintZeroQuantity", type: "error" },
      { inputs: [], name: "OwnerQueryForNonexistentToken", type: "error" },
      { inputs: [], name: "TransferCallerNotOwnerNorApproved", type: "error" },
      { inputs: [], name: "TransferFromIncorrectOwner", type: "error" },
      {
        inputs: [],
        name: "TransferToNonERC721ReceiverImplementer",
        type: "error",
      },
      { inputs: [], name: "TransferToZeroAddress", type: "error" },
      { inputs: [], name: "URIQueryForNonexistentToken", type: "error" },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "approved",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Approval",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            indexed: false,
            internalType: "bool",
            name: "approved",
            type: "bool",
          },
        ],
        name: "ApprovalForAll",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "previousOwner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "newOwner",
            type: "address",
          },
        ],
        name: "OwnershipTransferred",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "Transfer",
        type: "event",
      },
      {
        inputs: [],
        name: "AUCTION_DROP_INTERVAL",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "AUCTION_DROP_PER_STEP",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "AUCTION_END_PRICE",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "AUCTION_PRICE_CURVE_LENGTH",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "AUCTION_START_DATE",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "AUCTION_START_PRICE",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "quantity", type: "uint256" },
        ],
        name: "auctionMint",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "balanceOf",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint32", name: "nonce", type: "uint32" }],
        name: "burnNonce",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "getApproved",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "_saleStartTime", type: "uint256" },
        ],
        name: "getAuctionPrice",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getSavedList",
        outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "owner", type: "address" },
          { internalType: "address", name: "operator", type: "address" },
        ],
        name: "isApprovedForAll",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint8", name: "_v", type: "uint8" },
          { internalType: "bytes32", name: "_r", type: "bytes32" },
          { internalType: "bytes32", name: "_s", type: "bytes32" },
          { internalType: "int256", name: "quantity", type: "int256" },
          { internalType: "int256", name: "tier", type: "int256" },
          { internalType: "uint32", name: "count", type: "uint32" },
        ],
        name: "mintFromSignature",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "name",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "numberMinted",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "owner", type: "address" }],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
          { internalType: "bytes", name: "_data", type: "bytes" },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "operator", type: "address" },
          { internalType: "bool", name: "approved", type: "bool" },
        ],
        name: "setApprovalForAll",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "price", type: "uint256" },
          { internalType: "uint256", name: "endPrice", type: "uint256" },
        ],
        name: "setAuctionStartPrice",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "string", name: "URI", type: "string" }],
        name: "setBaseURI",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "start", type: "uint256" }],
        name: "setDutchAuctionStartTime",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "server", type: "address" }],
        name: "setServerAddress",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint64", name: "price", type: "uint64" }],
        name: "setTier2Price",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint64", name: "price", type: "uint64" }],
        name: "setTier3Price",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint64", name: "price", type: "uint64" }],
        name: "setTier4Price",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint64", name: "price", type: "uint64" }],
        name: "setTier5Price",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256[]", name: "list", type: "uint256[]" },
        ],
        name: "startEvent",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "bytes4", name: "interfaceId", type: "bytes4" },
        ],
        name: "supportsInterface",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "tier2Price",
        outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "tier3Price",
        outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "tier4Price",
        outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "tier5Price",
        outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "tokenURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "totalSupply",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "from", type: "address" },
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "tokenId", type: "uint256" },
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "viewBaseURI",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    "0x2a48420D75777aF4c99970C0ED3C25effD1C08be"
  );

  // Listening for "Transfer" event
  myContract.events
    .Transfer({
      fromBlock: await web3.eth.getBlockNumber() // Gets the latest block everytime when the app is started. Will start listening to events that occur after this Block.
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

      // Initializing a Big Number with 0 for storing the transaction value later
      let wethValue = new BN(0);

      // Consoling the Transaction Receipt Logs
      console.log(txReceipt.logs);
      txReceipt?.logs.forEach((currentLog) => {
        // Getting To, From and Value using the Transfer topic
        if (
          currentLog.topics[2]?.toLowerCase() ==
            web3.utils.padLeft(res.returnValues.from, 64).toLowerCase() &&
          currentLog.address.toLowerCase() == WETH_ADDRESS &&
          currentLog.topics[0]?.toLowerCase() ==
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef".toLowerCase()
        ) {
          // Getting Transaction Value (if paid with WEth)
          const v = `${parseInt(currentLog.data)}`;
          console.log(`Weth value found ${v}`);
          // Converting from Wei to WEth
          wethValue = wethValue.plus(web3.utils.fromWei(v));
        }
      });
      // Getting Transaction value if paid via Eth
      let value = new BN(web3.utils.fromWei(tx.value));
      // Consoling the transaction Value - Eth or WEth
      console.log(
        `WETH Value: ${wethValue.toFixed()}, ETH Value: ${value.toFixed()}`
      );
      // Setting value to WEth if Eth is empty i.e. transaction occured using WEth
      value = value.gt(0) ? value : wethValue;
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
        };

        // Checking if the transfer was a mint or a sale
        if (
          res.returnValues.from !=
            "0x0000000000000000000000000000000000000000" &&
          parseFloat(value.toFixed()) > 0
        ) {
          // Consoling the Message Block generate above
          console.log(message);
          try {
            // Connecting to MongoDB Client
            // await mongoClient.connect();
            // const database = mongoClient.db("mv3");
            // const collection = database.collection("mv3-sales");
            // // Checking if the there was a sync error and the same transaction already exists in the databse
            // const previousRecords = await collection.findOne({
            //   from: res.returnValues.from,
            //   to: res.returnValues.to,
            //   timestamp: block.timestamp,
            // });
            // if (previousRecords == undefined) {
            // If transaction is new, we add it to the Database
            // const result = await collection.insertOne(message);
            // console.log(
            //   `Adding transaction to database with id: ${result.insertedId.toString()}`
            // );

            /**
             * TODO: Remove me once implemented
             * Data needed: Token name/title, value(ETH, possibly USD too?), OpenSea URL
             * Let Twitter take care of the token preview/image
             */
            // const USDPrice =
            //   parseFloat(message.value) * parseFloat(await getEthToUSDPrice());
            // const tweet = `MV3 Access Pass ${message.tokenId} just got sold for ${message.value} Eth (${USDPrice} USD)!\
            //   https://opensea.io/assets/0x2a48420d75777af4c99970c0ed3c25effd1c08be/${message.tokenId}\
            //   https://etherscan.io/tx/${tx.hash}`;
            // console.log(tweet);
            // try {
            //   await twitterClient.v2.tweet(tweet);
            // } catch (e) {
            //   console.error(e);
            // }
            /**
             * TODO: Remove me once implemented
             * Discord BOT - Send Message
             */
            try {
              const channel = await discordSetup(
                process.env.DISCORD_BOT_TOKEN,
                process.env.DISCORD_CHANNEL_ID
              );
              console.log({ channel });
              const uri = await myContract.methods
                .tokenURI(res.returnValues.tokenId)
                .call();
              console.log({ uri });
              const metadata = await fetchMetadata(uri);
              console.log({ metadata });
              const discordMessage = createMessage(
                metadata,
                value.toFixed(),
                res.returnValues.to,
                res.returnValues.from,
                block.timestamp,
                res.returnValues.tokenId
              );
              const returnMessage = await discordMessage;
              console.log(returnMessage);
              await channel.send({ embeds: [returnMessage] });
            } catch (e) {
              console.error(e);
            }
            // } else {
            //   console.log("Duplicate Transaction!");
            // }
          } catch (e) {
            console.error(e);
          }
          // finally {
          //   // Closing Mongo Connection
          //   await mongoClient.close();
          // }
        }
      }
    })
    .on("error", function (err, receipt) {
      console.log({ err });
    });
};

getEvents();
