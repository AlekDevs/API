import { Channel } from '../data/models/channel';
import { UserDocument } from '../data/models/user';
import { generateSnowflake } from '../data/snowflake-entity';
import Log from '../utils/log';
import Deps from '../utils/deps';
import Users from '../data/users';
import { WSService } from './ws-service';
import { Lean } from '../data/types/entity-types';
import Channels from '../data/channels';

export class SystemBot {
  private _self: UserDocument;
  get self() { return this._self; }

  constructor(
    private channels = Deps.get<Channels>(Channels),
    private users = Deps.get<Users>(Users),
    private ws = Deps.get<WSService>(WSService),
  ) {}

  public async init() {
    if (this.self) return;

    this._self = await this.users.updateSystemUser();
    await this.readyUp();
  }

  private async readyUp() {
    const key = this.users.createToken(this.self?.id);
    const { user } = await this.ws.emitAsync('READY', { key });
    this._self = user as any;

    Log.info('Initialized bot', 'bot');
  }

  public message(channel: Lean.Channel, content: string) {
    return this.ws.emitAsync('MESSAGE_CREATE', {
      channelId: channel.id,
      partialMessage: { content },
    });
  }

  public async getDMChannel(user: UserDocument) {
    return this.channels.getDMByMembers(this.self.id, user.id);
  }
}
