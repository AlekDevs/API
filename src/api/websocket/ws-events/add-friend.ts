import { Socket } from 'socket.io';
import Channels from '../../../data/channels';
import { DMChannelDocument } from '../../../data/models/channel';
import { SelfUserDocument, User, UserDocument } from '../../../data/models/user';
import Users from '../../../data/users';
import Deps from '../../../utils/deps';
import { WebSocket } from '../websocket';
import { WSEvent, Args, Params } from './ws-event';

export default class implements WSEvent<'ADD_FRIEND'> {
  on = 'ADD_FRIEND' as const;

  constructor(
    private channels = Deps.get<Channels>(Channels),
    private users = Deps.get<Users>(Users),
  ) {}

  public async invoke(ws: WebSocket, client: Socket, { username }: Params.AddFriend) {
    const senderId = ws.sessions.userId(client);
    let sender = await this.users.getSelf(senderId);
    let friend = await this.users.getByUsername(username.toLowerCase());

    const isBlocking = friend.ignored.userIds.includes(sender._id);
    if (isBlocking)
      throw new TypeError('This user is blocking you');
    
    let dmChannel: DMChannelDocument;
    ({ sender, friend, dmChannel } = await this.handle(sender, friend) as any);
    
    if (dmChannel)    
      await client.join(dmChannel._id);

    ws.io
      .to(senderId)
      .to(friend._id)
      .emit('ADD_FRIEND', {
        sender: this.users.secure(sender),
        friend: this.users.secure(friend),
      } as Args.AddFriend);
  }

  private async handle(sender: SelfUserDocument, friend: SelfUserDocument): Promise<Args.AddFriend> {
    if (sender._id === friend._id)
      throw new TypeError('You cannot add yourself as a friend');
      
    const hasSentRequest = sender.friendRequestIds.includes(friend._id);
    if (!hasSentRequest) return {
      friend,
      sender: await this.sendRequest(sender, friend),
    }
    
    const hasReturnedRequest = friend.friendRequestIds.includes(sender._id);    
    if (hasReturnedRequest) return {
      friend: await this.acceptRequest(friend, sender),
      sender: await this.acceptRequest(sender, friend),
      dmChannel: await this.channels.getDMByMembers(sender._id, friend._id)
        ?? await this.channels.createDM(sender._id, friend._id),
    }

    return { sender, friend };
  }

  private async sendRequest(sender: SelfUserDocument, friend: UserDocument) {
    sender.friendRequestIds.push(friend._id);
    return sender.save();
  }

  private async acceptRequest(sender: SelfUserDocument, friend: SelfUserDocument) {
    const friendExists = sender.friendIds.includes(friend._id);
    if (friendExists) return friend;
    
    const index = sender.friendRequestIds.indexOf(friend._id);
    sender.friendRequestIds.splice(index, 1);
    sender.friendIds.push(friend._id);
    return sender.save();
  }
}
