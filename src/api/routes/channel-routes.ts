import { Router } from 'express';
import Channels from '../../data/channels';
import Messages from '../../data/messages';
import { SelfUserDocument } from '../../data/models/user';
import Pings from '../../data/pings';
import { Lean } from '../../data/types/entity-types';
import Deps from '../../utils/deps';
import { updateUser, validateUser } from '../modules/middleware';
import { WebSocket } from '../websocket/websocket';
import { Args } from '../websocket/ws-events/ws-event';

export const router = Router();

const channels = Deps.get<Channels>(Channels);
const messages = Deps.get<Messages>(Messages);
const pings = Deps.get<Pings>(Pings);
const ws = Deps.get<WebSocket>(WebSocket);

router.get('/', updateUser, validateUser, async (req, res) => {
  const all = await channels.getGuildsChannels(res.locals.user);
  res.json(all);
});

router.get('/:channelId/messages', updateUser, validateUser, async (req, res) => {
  const channelId = req.params.channelId;

  const user: SelfUserDocument = res.locals.user;
  const channelMsgs = (await messages
    .getChannelMessages(channelId) ?? await messages
    .getDMChannelMessages(channelId, res.locals.user.id));  

  const batchSize = 25;
  const back = Math.max(channelMsgs.length - parseInt(req.query.back as string)
    || batchSize, 0);
  
  const slicedMsgs = channelMsgs
    .slice(back)
    .map(m => {
      const isIgnored = user.ignored.userIds.includes(m.authorId);
      if (isIgnored)
        m.content = 'This user is blocked, and this message content has been hidden.';
      return m;
    });  

  const index = slicedMsgs.length - 1;
  const lastMessage = slicedMsgs[index];
  if (lastMessage) {
    await pings.markAsRead(user, lastMessage);
    ws.io
      .to(user.id)
      .emit('USER_UPDATE', {
        partialUser: { lastReadMessages: user.lastReadMessages },
      } as Args.UserUpdate);
  }
  
  res.json(slicedMsgs);
});

router.get('/:id', updateUser, validateUser, async (req, res) => {
  const channel = await channels.get(req.params.id);
  res.json(channel);
});

