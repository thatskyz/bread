import { Message } from 'discord.js';
import { isEnabledChannel } from '../../utils/DatabaseUtils';
import { attemptDelete } from '../../utils/MessageUtils';
import { addToCachedUserQueue, addToCounterQueue } from '../../utils/QueueUtils';

const legacyPrefix = '.:';
const legacyMessageCommands = [
  `${legacyPrefix}help`,
  `${legacyPrefix}invite`,
  `${legacyPrefix}leaderboard`,
  `${legacyPrefix}mark`,
  `${legacyPrefix}stats`,
  `${legacyPrefix}unmark`,
];

export async function messageCreateListener(message: Message): Promise<void> {
  if (!message.inGuild()) return; // Make sure the message is from a guild
  if (message.author.id === message.client.user?.id) return; // Ignore the message if it is from the bot
  const isInEnabledChannel = await isEnabledChannel(message.guildId, message.channelId);
  // Enabled channel checks
  if (isInEnabledChannel) {
    if (message.author.bot) return attemptDelete(message);
    if (message.content !== '🍞') return attemptDelete(message);
  }
  if (message.author.bot) return; // Ignore bots
  if (message.content.includes('🍞')) {
    addToCounterQueue({
      guildId: message.guildId,
      channelId: message.channelId,
      userId: message.author.id,
    });
    addToCachedUserQueue({
      userId: message.author.id,
      username: message.author.username,
      discriminator: message.author.discriminator,
    });
  }
  const currentEpochTime = Math.floor(new Date().getTime() / 1000);
  const disableMessageCommandsReplyEpochTime = 1644037200;
  if (
    !isInEnabledChannel &&
    currentEpochTime < disableMessageCommandsReplyEpochTime &&
    message.guild.me?.permissionsIn(message.channel).has('SEND_MESSAGES') &&
    message.guild.me.permissionsIn(message.channel).has('READ_MESSAGE_HISTORY')
  ) {
    for (let i = 0; i < legacyMessageCommands.length; i += 1) {
      if (message.content.toLowerCase().startsWith(legacyMessageCommands[i])) {
        message.reply({
          content: `${message.client.user?.username} has been updated to no longer use message commands, please type \`/\` to access the new slash commands instead.`,
          allowedMentions: {
            repliedUser: false,
            parse: [],
          },
        });
        return;
      }
    }
  }
}
