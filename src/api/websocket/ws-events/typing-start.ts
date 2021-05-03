import { Socket } from 'socket.io';
import { WebSocket } from '../websocket';
import { WSEvent, Args, Params, WSEventParams } from './ws-event';

export default class implements WSEvent<'TYPING_START'> {
  on = 'TYPING_START' as const;

  public async invoke(ws: WebSocket, client: Socket, { channelId }: Params.TypingStart) {    
    ws.io
      .to(channelId)
      .emit('TYPING_START', {
        userId: ws.sessions.userId(client),
        channelId,
      } as Args.TypingStart);
  }
}
