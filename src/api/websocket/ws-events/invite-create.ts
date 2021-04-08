import { Socket } from 'socket.io';
import Invites from '../../../data/invites';
import { PermissionTypes } from '../../../data/types/entity-types';
import Deps from '../../../utils/deps';
import { WSGuard } from '../../modules/ws-guard';
import { WebSocket } from '../websocket';
import { WSEvent, Args, Params, WSEventParams } from './ws-event';

export default class implements WSEvent<'INVITE_CREATE'> {
  on = 'INVITE_CREATE' as const;

  constructor(
    private guard = Deps.get<WSGuard>(WSGuard),
    private invites = Deps.get<Invites>(Invites),
  ) {}

  public async invoke(ws: WebSocket, client: Socket, params: Params.InviteCreate) {
    await this.guard.can(client, params.guildId, PermissionTypes.General.MANAGE_GUILD);

    const invite = await this.invites.create(params, ws.sessions.userId(client));

    ws.io
      .to(params.guildId)
      .emit('INVITE_CREATE', { invite } as Args.InviteCreate);
  }
}
