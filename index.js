require('dotenv').config();
const Discord = require('discord.js');
const { SapphireClient } = require('@sapphire/framework');
const { GatewayIntentBits } = require('discord.js');
// require('./commands/motivateCommand/motivate');
const messages = require('./commands/motivateCommand/motivationalMessages');

const client = new  SapphireClient({
  loadMessageCommandListeners: true, 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.MessageContent,
    // GatewayIntentBits.GuildMembers,
]});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', msg => {
  if (msg.content === '!motivate') {
    const index = Math.floor(Math.random() * messages.length);
    message = messages[index];
    msg.channel.send(message);
  }
});

const main = async () => {
  try {
    const token = process.env.DISCORD_TOKEN;
    client.logger.info('Logging in');
    await client.login(process.env.TOKEN);
    client.logger.info('Logged in');
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
  }
};

main();

module.exports = client;