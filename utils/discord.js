const { format } = require("date-fns");
const { Intents, TextChannel } = require("discord.js");
const Discord = require("discord.js");
const { getEthToUSDPrice } = require("./ethPrice");

const discordSetup = (discordBotToken, discordChannelId) => {
  const discordBot = new Discord.Client({
    intents: [Intents.FLAGS.GUILD_MESSAGES],
  });
  return new Promise((resolve, reject) => {
    discordBot.login(discordBotToken);
    discordBot.on("ready", async () => {
      const channel = await discordBot.channels.fetch(discordChannelId);
      resolve(channel);
    });
  });
};

const createMessage = async (
  metadata,
  value,
  buyer,
  seller,
  timestamp,
  tokenId
) =>
  new Discord.MessageEmbed()
    .setColor("#66ff82")
    .setTitle(`${metadata.name} sold!`)
    .addFields(
      { name: "Name", value: `${metadata.name}` },
      { name: "Amount (Eth)", value: `${value} Eth` },
      {
        name: "Amount (USD",
        value: `${
          parseFloat(value) * parseFloat(await getEthToUSDPrice())
        } USD}`,
      },
      { name: "Buyer", value: buyer },
      { name: "Seller", value: seller },
      {
        name: "Block Time",
        value: format(new Date(parseInt(timestamp) * 1000), "MMM do y h:mm a"),
      }
    )
    .setURL(
      `https://opensea.io/assets/0x2a48420d75777af4c99970c0ed3c25effd1c08be/${tokenId}`
    )
    .setImage(metadata.image);

module.exports = {
  createMessage,
  discordSetup,
};
