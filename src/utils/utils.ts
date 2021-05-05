import { hacker } from 'faker';
import { Document } from 'mongoose';
import { snowflakeToDate } from '../data/snowflake-entity';
import { patterns } from '../data/types/entity-types';

export function getNameAcronym(name: string) {  
  return name
    .split(' ')
    .slice(0, 3)
    .map(str => str[0])
    .join('');
}

export const validators = {
  minLength: (min: number) => (val: string | any[]) => val.length >= min,
  maxLength: (max: number) => (val: string | any[]) => val.length <= max,
  optionalSnowflake: (val: string) => !val || patterns.snowflake.test(val),
};

export function createdAtToDate(this: Document) {  
  return snowflakeToDate(this._id);
}

export function generateUsername() {
  return `${hacker
    .adjective()
    .replace(/ /, '')}-${hacker
    .noun()
    .replace(/ /, '')}`
}

export function checkForDuplicates(array: any[]) {
  return new Set(array).size !== array.length
}

export const array = {
  ascending: (a, b) => (a > b) ? 1 : -1,
};
