import { Document, model, Schema } from 'mongoose';
import { createdAtToDate } from '../../utils/utils';
import { generateSnowflake } from '../snowflake-entity';
import { Lean, InviteTypes, patterns } from '../types/entity-types';

export interface InviteDocument extends Document, Lean.Invite {
  _id: string;
  createdAt: never;
}

export function generateInviteCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  const codeLength = 7;
  
  let result = '';
  for (let i = 0; i < codeLength; i++)
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  return result;
}

export const Invite = model<InviteDocument>('invite', new Schema({
  _id: {
    type: String,
    default: generateInviteCode,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  options: new Schema<InviteTypes.Options>({
    expiresAt: Date,
    maxUses: {
      type: Number,
      min: [1, 'Max uses too low'],
      max: [1000, 'Max uses too high'],
    },
  }),
  inviterId: {
    type: String,
    required: [true, 'Inviter ID is required'],
    validate: [patterns.snowflake, 'Invalid Snowflake ID'],
  },
  guildId: {
    type: String,
    required: [true, 'Guild ID is required'],
    validate: [patterns.snowflake, 'Invalid Snowflake ID'],
  },
  uses: Number,
}, { toJSON: { getters: true } }));
