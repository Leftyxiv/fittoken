require('dotenv').config();
const Discord = require('discord.js');
const { SapphireClient } = require('@sapphire/framework');
const { GatewayIntentBits } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');
const mongoose = require('mongoose');
const { User, Log } = require('./src/models'); 

const client = new SapphireClient({
  loadMessageCommandListeners: true,
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    // GatewayIntentBits.GuildMembers,
  ],
});

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', function (message) {
  if (message.author.bot) return;
  if (message.content.startsWith('!chat')) {
    let prompt = `You: ${message.content.replace(/^!chat\s*/, '')}\n`;
    try {
      (async () => {
        let gptResponse = await openai.createCompletion({
          model: 'text-davinci-002',
          prompt: prompt,
          max_tokens: 60,
          temperature: 0.3,
          top_p: 0.3,
          presence_penalty: 0,
          frequency_penalty: 0.5,
        });
        message.reply(`${gptResponse.data.choices[0].text}`); //.substring(5)}`);
        prompt += `${gptResponse.data.choices[0].text}\n`;
      })();
    } catch (err) {
      console.log(err.message);
    }
  }
});

client.on('messageCreate', async function (message) {
  if (message.author.bot) return;
  if (message.content.startsWith('!log')) {
    let { id, username } = message.author;

    let user = await User.findOne({ discordId: id });
    if (!user) {
      user = await User.create({
        name: username,
        discordId: id,
        lastActivity: new Date(),
      });
    }
    let workout = message.content.replace(/^!log\s*/, '').split(' ');
    let type = isNaN(workout[0]) ? workout[0] : workout[1];
    let time = isNaN(!workout[0]) ? Number(workout[0]) : Number(workout[1]);
    if (workout.length !== 2 || typeof type !== 'string' || typeof time !== 'number') {
      return message.reply('There was an error! The command must be sent using either `!log time workout` or `!log workout time`');
    }
    await Log.create({
      user,
      type,
      time,
    })
    message.reply(`Workout of ${type} successfully logged, ${username}!`)
    // // Send the message
    let today = new Date();
    let sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    let logs = await Log.find({ user: user, createdAt: { $gte: sevenDaysAgo } });
    let times = logs.reduce((accum, item) => accum += item.time, 0);
    message.reply(`${username}, you have logged ${times} minutes of exercise this week!`)
  }
});

const updateUserActivity = async function (message) {
  if (message.author.bot) return;

  let { id } = message.author;
  let user = await User.findOneAndUpdate(
    { discordId: id },
    { lastActivity: new Date() }
  );
  if (!user) {
    user = await User.create({
      name: message.author.username,
      discordId: id,
      lastActivity: new Date(),
    });
  }
}

client.on('messageCreate', async function (message) {
 updateUserActivity(message);
});

client.on('messageReactionAdd', async function (message) {
  updateUserActivity(message);
});

client.on('guildMemberRemove', async function (member) {
  let user = await User.findOneAndDelete(member.id);

  const channel = member.guild.channels.cache.get('1099854206082486293')
  if (channel) {
    channel.send(`${user.username} has left the server and been removed from the database.`)
  }
});
// admin channel message watcher
client.on('messageCreate', async function (message) {
  if (message.channelId !== '1099854206082486293') {
    return;
  }
  if(message.content.startsWith('!listusers')) {
    const channel = client.channels.cache.get('1099854206082486293');
    let users = await User.find({}).sort({ lastActivity: -1 });
    for (let i = 0; i < users.length; ++i) {
      const lastActivity = users[i].lastActivity instanceof Date ? users[i].lastActivity : 'unknown';
      await channel.send(`${users[i].name}: ${lastActivity}`);
    }
  }
});

const main = async () => {
  try {
    client.logger.info('Logging in');
    await client.login(process.env.TOKEN);
    client.logger.info('Logged in');
    mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true, useUnifiedTopology: true
    }).then(() => console.log('Connected to MongoDB!'));
  } catch (error) {
    client.logger.fatal(error);
    client.destroy();
    process.exit(1);
  }
};

main();

module.exports = client;
