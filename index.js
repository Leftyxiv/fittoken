require('dotenv').config();
const Discord = require('discord.js');
const { GatewayIntentBits } = require('discord.js');
// require('./commands/motivateCommand/motivate');
const messages = require('./commands/motivateCommand/motivationalMessages');

const client = new Discord.Client({ 
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

client.login(process.env.TOKEN);

module.exports = client;