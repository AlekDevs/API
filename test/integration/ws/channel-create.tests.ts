import { WebSocket } from '../../../src/api/websocket/websocket';
import io from 'socket.io-client';
import ChannelCreate from '../../../src/api/websocket/ws-events/channel-create';
import { Mock } from '../../mock/mock';
import { expect, spy } from 'chai';
import { Guild, GuildDocument } from '../../../src/data/models/guild';
import { Partial } from '../../../src/data/types/ws-types';
import { PermissionTypes } from '../../../src/data/types/entity-types';
import { RoleDocument } from '../../../src/data/models/role';

describe('channel-create', () => {
  const client = io(`http://localhost:${process.env.PORT}`) as any;
  let ws: WebSocket;
  let event: ChannelCreate;

  let guild: GuildDocument;
  let role: RoleDocument;

  beforeEach(async () => {
    ({ ws, event, guild, role } = await Mock.defaultSetup(client, ChannelCreate))
  });

  afterEach(async () => await Mock.afterEach(ws));
  after(async () => await Mock.after(client));

  it('member creates channel, manage channels perms, fulfilled', async () => {
    role.permissions |= PermissionTypes.General.MANAGE_CHANNELS;
    await role.save();
  
    await expect(createChannel()).to.be.fulfilled;
  });

  it('member successfully creates channel, new channel added', async () => {
    const oldLength = guild.channels.length;
    
    await makeGuildOwner();
    await createChannel();

    guild = await Guild.findById(guild.id);
    expect(guild.channels.length).to.be.greaterThan(oldLength);
  });

  it('member successfully creates channel, client joins channel room', async () => {
    const join = spy.on(client, 'join');
    
    await makeGuildOwner();
    await createChannel();

    guild = await Guild.findById(guild.id);

    expect(join).to.be.called();
  });

  async function createChannel(partialChannel?: Partial.Channel) {
    return event.invoke(ws, client, {
      guildId: guild.id,
      partialChannel: partialChannel ?? {
        name: 'chat',
        type: 'TEXT',
        summary: '',
      }
    });
  }

  async function makeGuildOwner() {
    ws.sessions.set(client.id, guild.ownerId);
    await Mock.clearRolePerms(guild);
  }
});
