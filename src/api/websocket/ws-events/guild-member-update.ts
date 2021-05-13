import { Socket } from 'socket.io';
import GuildMembers from '../../../data/guild-members';
import Guilds from '../../../data/guilds';
import { GuildMember } from '../../../data/models/guild-member';
import { Role } from '../../../data/models/role';
import Roles from '../../../data/roles';
import { Lean, PermissionTypes } from '../../../data/types/entity-types';
import Users from '../../../data/users';
import Deps from '../../../utils/deps';
import { array } from '../../../utils/utils';
import { WSGuard } from '../../modules/ws-guard';
import { WebSocket } from '../websocket';
import { WSEvent, Args, Params } from './ws-event';

export default class implements WSEvent<'GUILD_MEMBER_UPDATE'> {
  on = 'GUILD_MEMBER_UPDATE' as const;

  constructor(
    private guard = Deps.get<WSGuard>(WSGuard),
    private guilds = Deps.get<Guilds>(Guilds),
    private guildMembers = Deps.get<GuildMembers>(GuildMembers),
    private roles = Deps.get<Roles>(Roles),
  ) {}

  public async invoke(ws: WebSocket, client: Socket, { memberId, partialMember }: Params.GuildMemberUpdate) {
    const member = await this.guildMembers.get(memberId);

    const selfUserId = ws.sessions.userId(client);
    const selfMember = await this.guildMembers.getInGuild(member.guildId, selfUserId);

    await this.guard.validateCan(client, selfMember.guildId, PermissionTypes.General.MANAGE_ROLES);
    this.guard.validateKeys('guildMember', partialMember);

    const guild = await this.guilds.get(member.guildId);
    const selfIsHigher = await this.roles.isHigher(guild, selfMember, member.roleIds);
    
    const isSelf = selfMember.id === memberId;
    if (!isSelf && !selfIsHigher)
      throw new TypeError('Member has higher roles'); 
    
    const everyoneRole = guild.roles.find(r => r.name === '@everyone') as Lean.Role;
    await member.updateOne({
        ...partialMember,
        roleIds: [everyoneRole.id].concat(partialMember.roleIds ?? []),
      },
      { runValidators: true },
    );
    
    ws.io
      .to(member.guildId)
      .emit('GUILD_MEMBER_UPDATE', {
        guildId: member.guildId,
        memberId,
        partialMember,
      } as Args.GuildMemberUpdate);
  }
}
