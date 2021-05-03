import { Document, model, Schema } from 'mongoose';
import { checkForDuplicates, createdAtToDate } from '../../utils/utils';
import { generateSnowflake } from '../snowflake-entity';
import { Lean, patterns, PermissionTypes } from '../types/entity-types';

export function hasPermission(current: PermissionTypes.Permission, required: PermissionTypes.Permission) {
  return Boolean(current & required)
    || Boolean(current & PermissionTypes.General.ADMINISTRATOR);
}

const everyoneColor = '#ffffff';

export interface RoleDocument extends Document, Lean.Role {
  _id: string;
  createdAt: never;
}

export const Role = model<RoleDocument>('role', new Schema({
  _id: {
    type: String,
    default: generateSnowflake,
  },
  color: {
    type: String,
    default: everyoneColor,
    validate: {
      validator: function(this: RoleDocument, val: string) {
        return this?.name !== '@everyone'
          || val === everyoneColor
          || !val;
      },
      message: 'Cannot change @everyone role color',
    }
  },
  createdAt: {
    type: Date,
    get: createdAtToDate,
  },
  guildId: {
    type: String,
    required: [true, 'Owner ID is required'],
    validate: [patterns.snowflake, 'Invalid Snowflake ID'],
  },
  hoisted: Boolean,
  mentionable: Boolean,
  name: {
    type: String,
    required: [true, 'Name is required'],
    maxlength: [32, 'Name too long'],
  },
  position: {
    type: Number,
    required: [true, 'Position is required'],
    min: [0, 'Position must be greater than 0'],
    unique: async function(this: RoleDocument) {
      const roles = await Role.find({ guildId: this.guildId });
      return checkForDuplicates(roles);
    }
  },
  permissions: {
    type: Number,
    default: PermissionTypes.defaultPermissions,
    required: [true, 'Permissions is required'],
    validate: {
      validator: (val: number) => Number.isInteger(val) && val >= 0,
      message: 'Invalid permissions integer',
    },
  }
}, { toJSON: { getters: true } }));
