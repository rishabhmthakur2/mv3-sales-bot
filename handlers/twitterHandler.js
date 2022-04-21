const { TwitterApi } = require("twitter-api-v2");
const { getEthToUSDPrice } = require("../utils/ethPrice");

// Environment file used to host API keys
const dotenv = require("dotenv");
require("dotenv").config();

// Setting up Twitter's Client
const twitterClient = new TwitterApi({
  appKey: process.env.TWTR_API_KEY,
  appSecret: process.env.TWTR_API_KEY_SECRET,
  accessToken: process.env.TWTR_ACCESS_TOKEN,
  accessSecret: process.env.TWTR_ACCESS_TOKEN_SECRET,
});

const sendTweet = async (message) => {
  const USDPrice = parseFloat(
    parseFloat(message.value) * parseFloat(await getEthToUSDPrice())
  ).toFixed(2);
  const tweet =
    `${message.name} just got sold for ${message.value} ETH (${USDPrice} USD)! \n` +
    `https://etherscan.io/tx/${message.txHash} \n` +
    `https://opensea.io/assets/${process.env.CONTRACT_ADDRESS}/${message.tokenId}`;
  try {
    const tweetData = await twitterClient.v2.tweet(tweet);
    return tweetData;
  } catch (e) {
    console.error(e);
  }
};

module.exports = { sendTweet };
