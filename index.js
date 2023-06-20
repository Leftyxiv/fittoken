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
        const gptResponse = await openai.createCompletion({
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
    const { id, username } = message.author;

    let user = await User.findOne({ discordId: id });
    if (!user) {
      user = await User.create({
        name: username,
        discordId: id,
        lastActivity: new Date(),
      });
    }
    const workout = message.content.replace(/^!log\s*/, '').split(' ');
    const type = isNaN(workout[0]) ? workout[0] : workout[1];
    const time = isNaN(!workout[0]) ? Number(workout[0]) : Number(workout[1]);
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
    const today = new Date();
    const sevenDaysAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    const logs = await Log.find({ user: user, createdAt: { $gte: sevenDaysAgo } });
    const times = logs.reduce((accum, item) => accum += item.time, 0);
    message.reply(`${username}, you have logged ${times} minutes of exercise this week!`)
  }
});

const updateUserActivity = async (message) => {
  if (message.author.bot) return;

  const { id } = message.author;
  const user = await User.findByIdAndUpdate(id, {
    lastActivity: new Date()
  });
  if (!user) {
    user = await User.create({
      name: username,
      discordId: id,
      lastActivity: new Date(),
    });
  }
}

client.on('message', async (message) => {
 updateUserActivity(message);
});

client.on('messageReactionAdd', async () => {
  updateUserActivity(message);
});

client.on('guildMemberRemove', async(member) => {
  const user = await User.findByIdAndDelete(member.id);

  const channel = member.guild.channels.cache.get('1099854206082486293')
  if (channel) {
    channel.send(`${user.username} has left the server and been removed from the database.`)
  }
});
// admin channel message watcher
client.on('messageCreate', async(message) => {
  if (message.channelId !== '1099854206082486293') {
    return;
  }
  if(message.content.startsWith('!listusers')) {
    const channel = client.channels.cache.get('1099854206082486293');
    const users = await User.find({}).sort({ lastActivity: -1 });
    for(let i = 0; i < users.length; ++i) {
      await channel.send(`${user.name}: ${ user.hasOwnProperty('lastActivity') ? user.lastActivity : 'unkown' }`);
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
