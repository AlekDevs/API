import GuildMemberAdd from '../../../src/api/websocket/ws-events/guild-member-add';
import { WebSocket } from '../../../src/api/websocket/websocket';
import Deps from '../../../src/utils/deps';
import io from 'socket.io-client';
import { Mock } from '../../mock/mock';
import { UserDocument } from '../../../src/data/models/user';
import { GuildDocument } from '../../../src/data/models/guild';
import { Invite, InviteDocument } from '../../../src/data/models/invite';
import { expect, spy } from 'chai';
import Guilds from '../../../src/data/guilds';
import Users from '../../../src/data/users';

describe.only('guild-member-add', () => {
  const client = io(`http://localhost:${process.env.PORT}`) as any;
  let event: GuildMemberAdd;
  let guilds: Guilds;
  let users: Users;
  let ws: WebSocket;

  let user: UserDocument;
  let guild: GuildDocument;
  let invite: InviteDocument;

  beforeEach(async() => {
    ({ event, ws, user, guild } = await Mock.defaultSetup(client, GuildMemberAdd));

    guilds = Deps.get<Guilds>(Guilds);
    users = Deps.get<Users>(Users);

    user = await Mock.user([]);
    ws.sessions.set(client.id, user.id);

    invite = await Mock.invite(guild.id);
  });

  afterEach(async () => await Mock.afterEach(ws));
  after(async () => await Mock.after(client));

  it('valid invite and code, fulfilled', async () => {
    await expect(guildMemberAdd()).to.be.fulfilled;
  });

  it('user already joined, rejected', async () => {
    await guildMemberAdd();

    await expect(guildMemberAdd()).to.be.rejectedWith('User already in guild');
  });

  it('valid invite and code, is bot user, rejected', async () => {
    const bot = await Mock.bot();
    ws.sessions.set(client.id, bot._id);

    await expect(guildMemberAdd()).to.be.rejectedWith('Bot users cannot accept invites');
  });

  it('valid invite and code, member added to guild', async () => {
    const oldMemberCount = guild.members.length;
    await guildMemberAdd();    

    guild = await guilds.get(guild.id);    
    expect(guild.members.length).to.be.greaterThan(oldMemberCount);
  });

  it('valid invite and code, guild added to user guilds', async () => {
    await guildMemberAdd();

    user = await users.get(user.id);    
    expect(user.guilds.length).to.equal(1);
  });

  it('invite has reached max uses, is deleted', async () => {
    invite.options = { maxUses: 1 };
    await invite.save();

    await guildMemberAdd();
    invite = await Invite.findById(invite._id);
    expect(invite).to.be.null;
  });

  it('invite expired, rejected', async () => {
    invite.options = { expiresAt: new Date(0) };
    await invite.save();

    await expect(guildMemberAdd()).to.be.rejectedWith('Invite expired');
  });

  it('invalid invite code, rejected', async () => {
    invite._id = '';

    await expect(guildMemberAdd()).to.be.rejectedWith('Invite Not Found');
  });

  it('valid invite and code, emits to guild room', async () => {
    const to = spy.on(ws.io, 'to');

    await guildMemberAdd();

    guild = await guilds.get(guild.id);
    expect(to).to.have.been.called.with(guild._id);
  });

  function guildMemberAdd() {
    return event.invoke(ws, client, { inviteCode: invite._id });
  }
});
