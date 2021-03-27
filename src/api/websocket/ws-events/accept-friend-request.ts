import { Socket } from 'socket.io';
import Channels from '../../../data/channels';
import { UserDocument } from '../../../data/models/user';
import Users from '../../../data/users';
import Deps from '../../../utils/deps';
import { WebSocket } from '../websocket';
import { WSEvent, Args, Params } from './ws-event';

export default class implements WSEvent<'ACCEPT_FRIEND_REQUEST'> {
  on = 'ACCEPT_FRIEND_REQUEST' as const;

  constructor(
    private channels = Deps.get<Channels>(Channels),
    private users = Deps.get<Users>(Users),
  ) {}

  public async invoke(ws: WebSocket, client: Socket, { friendId }: Params.AcceptFriendRequest) {
    const senderId = ws.sessions.userId(client);
    const sender = await this.users.get(senderId);
    const friend = await this.users.get(friendId);

    ws.io
      .to(senderId)
      .to(friendId)
      .emit('ACCEPT_FRIEND_REQUEST', {
        sender: await this.acceptFriend(sender, friend),
        friend: await this.acceptFriend(friend, sender),
        dmChannel: await this.channels.createDM(senderId, friendId)
      } as Args.AcceptFriendRequest);
  }

  async acceptFriend(user: UserDocument, friend: UserDocument) {
    const friendExists = user.friendIds.includes(friend._id);
    return (!friendExists)
      ? user.update({
          $pull: { friendRequests: { userId: friend } },
          $push: { friendIds: friend._id },
        }, { runValidators: true })
      : user;
  }
}