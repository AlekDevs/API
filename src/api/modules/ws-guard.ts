import { Guild } from '../../data/models/guild';
import { GuildMember } from '../../data/models/guild-member';
import jwt from 'jsonwebtoken';
import Deps from '../../utils/deps';
import { WebSocket } from '../websocket/websocket';
import { Socket } from 'socket.io';
import Channels from '../../data/channels';
import Roles from '../../data/roles';
import { Lean, PermissionTypes } from '../../data/types/entity-types';
import Users from '../../data/users';
import Guilds from '../../data/guilds';
import GuildMembers from '../../data/guild-members';

export class WSGuard {
  constructor(
    private channels = Deps.get<Channels>(Channels),
    private guilds = Deps.get<Guilds>(Guilds),
    private guildMembers = Deps.get<GuildMembers>(GuildMembers),
    private roles = Deps.get<Roles>(Roles),
    private users = Deps.get<Users>(Users),
    private ws = Deps.get<WebSocket>(WebSocket),
  ) {}

  public userId(client: Socket) {
    return this.ws.sessions.get(client.id) ?? '';
  }

  public validateIsUser(client: Socket, userId: string) {    
    if (this.userId(client) !== userId)
      throw new TypeError('Unauthorized');
  }

  public async validateIsOwner(client: Socket, guildId: string) {    
    const isOwner = await Guild.exists({
      _id: guildId,
      ownerId: this.userId(client)
    });    
    if (!isOwner)
      throw new TypeError('Only the guild owner can do this');
  }

  public async canAccessChannel(client: Socket, channelId?: string, withUse = false) {
    const channel = await this.channels.get(channelId);
    await this.canAccess(channel, client, withUse);
  }
  private async canAccess(channel: Lean.Channel, client: Socket, withUse = false) {
    const userId = this.userId(client);
    if (channel.type === 'TEXT') {
      const perms = (!withUse)
        ? PermissionTypes.Text.READ_MESSAGES 
        : PermissionTypes.Text.READ_MESSAGES | PermissionTypes.Text.SEND_MESSAGES;
      await this.validateCan(client, channel.guildId, perms);
      return;
    } else if (channel.type === 'VOICE') {
      const perms = (!withUse)
        ? PermissionTypes.Voice.CONNECT 
        : PermissionTypes.Voice.CONNECT | PermissionTypes.Voice.SPEAK;
      await this.validateCan(client, channel.guildId, perms);
      return;
    }
    const inGroup = channel.memberIds?.includes(userId);
    if (!inGroup)
      throw new TypeError('Not DM Member');
  }

  public async validateCan(client: Socket, guildId: string | undefined, permission: PermissionTypes.PermissionString) {
    const userId = this.userId(client);

    const member = await this.guildMembers.getInGuild(guildId, userId);
    const guild = await this.guilds.get(guildId);

    const can = await this.roles.hasPermission(member, permission)
      || guild.ownerId === userId;    
    this.validate(can, permission);
  }  
  private validate(can: boolean, permission: PermissionTypes.PermissionString) {
    if (!can)
      throw new TypeError(`Missing Permissions - ${PermissionTypes.All[permission]}`);
  }

  public async decodeKey(key: string) {
    const id = this.users.verifyToken(key);      
    return { id };
  }
}
