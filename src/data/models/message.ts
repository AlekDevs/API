import { Document, model, Schema } from 'mongoose';
import { createdAtToDate, useId } from '../../utils/utils';
import { generateSnowflake } from '../snowflake-entity';
import { Lean, patterns } from '../types/entity-types';

export interface MessageDocument extends Document, Lean.Message {
  _id: string | never;
  id: string;
  createdAt: never;
}

export const Message = model<MessageDocument>('message', new Schema({
  _id: {
    type: String,
    default: generateSnowflake,
  },
  authorId: {
    type: String,
    required: [true, 'Author ID is required'],
    validate: [patterns.snowflake, 'Invalid Snowflake ID'],
  },
  channelId: {
    type: String,
    required: [true, 'Channel ID is required'],
    validate: [patterns.snowflake, 'Invalid Snowflake ID'],    
  },
  content: {
    type: String,
    minlength: [1, 'Content too short'],
    maxlength: [3000, 'Content too long'],
  },
  createdAt: {
    type: Date,
    get: createdAtToDate,
  },
  embed: Object, // TODO: make, and unit test embed schema
  updatedAt: Date,
}, { toJSON: { getters: true } }).method('toClient', useId));
