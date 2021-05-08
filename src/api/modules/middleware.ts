import { PermissionTypes } from '../../data/types/entity-types';
import Guilds from '../../data/guilds';
import { Guild, GuildDocument } from '../../data/models/guild';
import Roles from '../../data/roles';
import Users from '../../data/users';
import Deps from '../../utils/deps';
import { User } from '../../data/models/user';
import { APIError } from './api-error';
import { NextFunction, Request, Response } from 'express';

const guilds = Deps.get<Guilds>(Guilds);
const roles = Deps.get<Roles>(Roles);
const users = Deps.get<Users>(Users);

export async function fullyUpdateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.get('Authorization') as string;    
    const id = users.idFromAuth(key);    

    res.locals.user = await users.getSelf(id);
  } finally {
    return next();
  }
}
export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const key = req.get('Authorization') as string;    
    const id = users.idFromAuth(key);    

    res.locals.user = await users.getSelf(id, false);
  } finally {
    return next();
  }
}

export async function updateUsername(req: Request, res: Response, next: NextFunction) {
  if (!req.body.username) {
    const user = await User.findOne({ email: req.body.email });
    req.body.username = user?.username;    
  }  
  return next();
}

export function validateUser(req: Request, res: Response, next: NextFunction) {  
  if (res.locals.user)
    return next();
  throw new APIError(401, 'User not logged in');
}

export async function updateGuild(req: Request, res: Response, next: NextFunction) {
  res.locals.guild = await guilds.get(req.params.id);  
  return next();
}

export async function validateGuildExists(req: Request, res: Response, next: NextFunction) {
  const exists = await Guild.exists({ _id: req.params.id });
  return (exists)
    ? next()
    : res.status(404).json({ message: 'Guild does not exist' });
}
 
export async function validateGuildOwner(req: Request, res: Response, next: NextFunction) {
  const userOwnsGuild = res.locals.guild.ownerId === res.locals.user._id;
  if (userOwnsGuild)
    return next();
  throw new APIError(401, 'You do not own this guild!');
}

export function validateHasPermission(permission: PermissionTypes.Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const guild: GuildDocument = res.locals.guild;
    const member = guild.members.find(m => m.userId === res.locals.user._id);
    if (!member)
      throw new APIError(401, 'You are not a guild member');

    const isOwner = guild.ownerId === res.locals.user._id;
    const hasPerm = await roles.hasPermission(guild, member, permission);
    if (hasPerm || isOwner) return next();

    throw new APIError(401, 'Missing Permissions');
  };
}
