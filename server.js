var Web3 = require("web3");
const axios = require("axios");
const BN = require("bignumber.js");
const fs = require("fs");

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  "mongodb+srv://mv3:admin@cluster0.xtexu.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

let getEvents = async () => {
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
  var web3 = new Web3(
    "https://mainnet.infura.io/v3/d12d9a64dd9b4a24a318ec688a844411"
  );
  web3.setProvider(
    new Web3.providers.WebsocketProvider(
      "wss://mainnet.infura.io/ws/v3/d12d9a64dd9b4a24a318ec688a844411",
      options
    )
  );

  var myContract = await new web3.eth.Contract(
    [
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
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "getApproved",
        outputs: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
        ],
        name: "isApprovedForAll",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "ownerOf",
        outputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
        ],
        name: "safeTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "operator",
            type: "address",
          },
          {
            internalType: "bool",
            name: "_approved",
            type: "bool",
          },
        ],
        name: "setApprovalForAll",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "bytes4",
            name: "interfaceId",
            type: "bytes4",
          },
        ],
        name: "supportsInterface",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "tokenId",
            type: "uint256",
          },
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    "0x2a48420d75777af4c99970c0ed3c25effd1c08be"
  );

  myContract.events
    .Transfer({
      fromBlock: 14601851, // Will put in the Block number when the Block is deployed live on mainnet
    })
    .on("connected", function (subscriptionId) {
      console.log({ subscriptionId });
    })
    .on("data", async function (res) {
      const tx = await web3.eth.getTransaction(res.transactionHash);
      const txReceipt = await web3.eth.getTransactionReceipt(
        res.transactionHash
      );
      let wethValue = new BN(0);
      console.log(txReceipt.logs);
      txReceipt?.logs.forEach((currentLog) => {
        // check if WETH was transferred during this transaction
        if (
          currentLog.topics[2]?.toLowerCase() ==
            web3.utils.padLeft(res.returnValues.from, 64).toLowerCase() &&
          currentLog.address.toLowerCase() == WETH_ADDRESS &&
          currentLog.topics[0]?.toLowerCase() ==
            "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef".toLowerCase()
        ) {
          const v = `${parseInt(currentLog.data)}`;
          console.log(`Weth value found ${v}`);
          wethValue = wethValue.plus(web3.utils.fromWei(v));
        }
      });
      let value = new BN(web3.utils.fromWei(tx.value));
      console.log(
        `WETH Value: ${wethValue.toFixed()}, ETH Value: ${value.toFixed()}`
      );
      value = value.gt(0) ? value : wethValue;
      if (value.gt(0)) {
        const block = await web3.eth.getBlock(res.blockNumber);
        const message = {
          value: value.toFixed(),
          to: res.returnValues.to,
          from: res.returnValues.from,
          timestamp: block.timestamp,
          tokenId: res.returnValues.tokenId,
        };
        // Call to Twitter API here!

        if (
          res.returnValues.from != "0x0000000000000000000000000000000000000000"
        ) {
          console.log(message);
          fs.appendFileSync("logs.txt", Buffer.from(JSON.stringify(message)));
          // try {
          //   await client.connect();
          //   const database = client.db("mv3");
          //   const collection = database.collection("mv3-sales");
          //   const result = await collection.insertOne(message);
          // } finally {
          //   await client.close();
          // }
        }
      }
    })
    .on("error", function (err, receipt) {
      console.log({ err });
    });
};

getEvents();
