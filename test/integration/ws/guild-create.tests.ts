import { WebSocket } from '../../src/api/websocket/websocket';
import io from 'socket.io-client';
import GuildCreate from '../../src/api/websocket/ws-events/guild-create';
import { Guild, GuildDocument } from '../../src/data/models/guild';
import { User, UserDocument } from '../../src/data/models/user';
import { Mock } from '../mock';
import { expect } from 'chai';
import { PermissionTypes } from '../../src/data/types/entity-types';
import { GuildMemberDocument } from '../../src/data/models/guild-member';
import { Partial } from '../../src/data/types/ws-types';
import { generateSnowflake } from '../../src/data/snowflake-entity';

describe('guild-create', () => {
  const client = io(`http://localhost:${process.env.PORT}`) as any;
  let ws: WebSocket;
  let event: GuildCreate;

  let user: UserDocument;
  let member: GuildMemberDocument;

  beforeEach(async () => {
    ({ ws, event, member, user } = await Mock.defaultSetup(client, GuildCreate));
  });

  afterEach(async () => Mock.afterEach(ws));
  after(async () => await Mock.after(client));

  it('user creates guild, fulfilled', async () => {
    await expect(guildCreate()).to.be.fulfilled;
  });

  it('user creates guild, added to user.guilds', async () => {
    const oldCount = user.guilds.length;
    await guildCreate();

    user = await User.findById(user.id);
    expect(user.guilds.length).to.be.greaterThan(oldCount);
  });

  function guildCreate(partialGuild?: Partial.Guild) {
    return event.invoke(ws, client, {
      partialGuild: {
        name: 'Mock Guild',
        ...partialGuild,
      },
    });
  }
});