const { fetchMetadata } = require("../utils/metadata");
const { discordSetup, createMessage } = require("../utils/discord");

// Environment file used to host API keys
const dotenv = require("dotenv");
require("dotenv").config();

const sendDiscordMessage = async (myContract, message) => {
  try {
    const channel = await discordSetup(
      process.env.DISCORD_BOT_TOKEN,
      process.env.DISCORD_CHANNEL_ID
    );
    const uri = await myContract.methods.tokenURI(message.tokenId).call();
    const metadata = await fetchMetadata(uri);
    const discordMessage = createMessage(
      metadata,
      message.value,
      message.to,
      message.from,
      message.timestamp,
      message.tokenId
    );
    const returnMessage = await discordMessage;
    const messsageInfo = await channel.send({ embeds: [returnMessage] });
    return messsageInfo;
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  sendDiscordMessage,
};
