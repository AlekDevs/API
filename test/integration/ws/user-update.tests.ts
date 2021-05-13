import UserUpdate from '../../../src/api/websocket/ws-events/user-update';
import { WebSocket } from '../../../src/api/websocket/websocket';
import io from 'socket.io-client';
import { Mock } from '../../mock/mock';
import { User, UserDocument } from '../../../src/data/models/user';
import { expect } from 'chai';
import Deps from '../../../src/utils/deps';
import Users from '../../../src/data/users';
import { Lean, UserTypes } from '../../../src/data/types/entity-types';

describe('user-update', () => {
  const client = io(`http://localhost:${process.env.PORT}`) as any;
  let event: UserUpdate;
  let ws: WebSocket;

  let user: UserDocument;
  let key: string;

  beforeEach(async () => {
    ({ event, ws, user } = await Mock.defaultSetup(client, UserUpdate));

    regenToken();
  });

  afterEach(async () => {
    await user.deleteOne();
    await Mock.afterEach(ws);
  });
  after(async () => await Mock.after(client));

  it('client updates user, fulfilled', async () => {
    await expect(updateUser()).to.be.fulfilled;
  });

  it('client updates user, user is updated', async () => {
    await updateUser();
    
    const newUser = await User.findById(user.id);
    expect(user.username).to.not.equal(newUser.username);
  });

  it('client is impostor, rejected', async () => {
    user.id = '23u8123u12hg31873g183y21ufg321yt3';
    await regenToken();

    await expect(updateUser()).to.be.rejectedWith('User Not Found');
  });

  async function updateUser(options?: Partial<UserTypes.Self>) {
    return event.invoke(ws, client, {
      key,
      partialUser: {
        avatarURL: 'https://example.com',
        username: 'mock-user',
        ...options,
      },
    });
  }

  async function regenToken() {
    key = Deps
      .get<Users>(Users)
      .createToken(user.id, false);
  }
});
