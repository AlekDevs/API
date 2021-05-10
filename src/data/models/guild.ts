import { Document, model, Schema } from 'mongoose';
import { createdAtToDate, getNameAcronym, useId, validators } from '../../utils/utils';
import { generateSnowflake } from '../snowflake-entity';
import { Lean, patterns } from '../types/entity-types';

export interface GuildDocument extends Document, Lean.Guild {
  id: string;
  createdAt: never;
  nameAcronym: never;
}

export const Guild = model<GuildDocument>('guild', new Schema({
  _id: {
    type: String,
    default: generateSnowflake,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [32, 'Name is too long'],
  },
  createdAt: {
    type: Date,
    get: createdAtToDate,
  },
  nameAcronym: {
    type: String,
    get: function(this: GuildDocument) {      
      return getNameAcronym(this.name);
    }
  },
  iconURL: String,
  ownerId: {
    type: String,
    required: true,
    validate: [patterns.snowflake, 'Invalid Snowflake ID'],
  },
  channels: {
    type: [{
      type: String,
      ref: 'channel',
    }],
    validate: {
      validator: validators.maxLength(250),
      message: 'Channel limit reached',
    },
  },
  members: [{
    type: String,
    ref: 'guildMember',
  }],
  roles: {
    type: [{
      type: String,
      ref: 'role',
    }],
    validate: {
      validator: validators.minLength(1),
      message: 'Guild must have at least one role',
    },
  },
}, {
  toJSON: { getters: true }
}).method('toClient', useId));