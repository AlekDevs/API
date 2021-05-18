import { Socket } from 'socket.io';
import Channels from '../../../data/channels';
import Messages from '../../../data/messages';
import { Message } from '../../../data/models/message';
import { PermissionTypes } from '../../../data/types/entity-types';
import Deps from '../../../utils/deps';
import { WSGuard } from '../../modules/ws-guard';
import { WebSocket } from '../websocket';
import { WSEvent, Params, Args } from './ws-event';

export default class implements WSEvent<'MESSAGE_DELETE'> {
  on = 'MESSAGE_DELETE' as const;

  constructor(
    private channels = Deps.get<Channels>(Channels),
    private guard = Deps.get<WSGuard>(WSGuard),
    private messages = Deps.get<Messages>(Messages),
  ) {}

  public async invoke(ws: WebSocket, client: Socket, { messageId }: Params.MessageDelete) {
    const message = await this.messages.get(messageId);
    const channel = await this.channels.get(message.channelId);

    try {
      this.guard.validateIsUser(client, message.authorId);
    } catch {
      if (channel.type === 'DM')
        throw new TypeError('Only message author can do this');
      await this.guard.validateCan(client, channel.guildId, PermissionTypes.Text.MANAGE_MESSAGES);
    }
    await message.deleteOne();

    if (message.id === channel.lastMessageId) {
      const previousMessage = await Message.findOne({ channelId: channel.id });
      channel.lastMessageId = previousMessage?.id;
      await channel.save();
    }

    ws.io
      .to(message.channelId)
      .emit('MESSAGE_DELETE', {
        channelId: message.channelId,
        messageId: messageId,
      } as Args.MessageDelete);
  }
}
