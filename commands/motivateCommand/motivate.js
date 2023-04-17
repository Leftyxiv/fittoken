const messages = require('./motivationalMessages');
const { Command, RegisterBehavior } = require('@sapphire/framework');

class MotivateCommand extends Command {
  constructor(context, options) {
    super(context, {
      ...options,
      name: 'motivate',
      description: 'MOTIVATION',
    });
  }

  // Registers that this is a slash command
  registerApplicationCommands(registry) {
    registry.registerChatInputCommand(
      (builder) => builder
        .setName(this.name)
        .setDescription(this.description),
      {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
      },
    );
  }

  // Command run
  async chatInputRun(interaction) {
    // Get the user
    // TODO exception handling
    const channel = interaction.channel;
    const member = interaction.member.user;
    const memberGuildMember = interaction.guild.members.cache.get(member.id);

    // Creates the message for the motivation reaction
    const index = Math.floor(Math.random() * messages.length);
    const message = messages[index];
    const motivationMessage = `${memberGuildMember.displayName} is in worship!\n\n${message}`;

    // Send the message
    await interaction.reply('Begin worship!')
    await channel.send(motivationMessage);
  }
}

module.exports = MotivateCommand;
