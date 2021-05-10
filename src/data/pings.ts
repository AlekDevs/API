import { SelfUserDocument } from './models/user';
import { Lean, UserTypes } from './types/entity-types';

export default class Pings {
  public markAsRead(user: SelfUserDocument, message: Lean.Message) {
    user.lastReadMessages[message.channelId] = message.id;
    return user.updateOne(user);
  }

  public isIgnored(self: UserTypes.Self, channel: Lean.Channel, message: Lean.Message) {
    return self.id === message.authorId
      || self.ignored.channelIds.includes(channel.id)
      || self.ignored.guildIds.includes(channel.guildId as string)
      || self.ignored.userIds.includes(message.authorId);
  }
}
