import { FindOptionsWhere } from 'typeorm';
import { ObjectId } from 'mongodb';
import { BadRequestException } from '@nestjs/common';

/**
 * Type helper for TypeORM MongoDB queries with $or operator
 * This is needed because TypeORM's MongoDB typing doesn't fully support
 * MongoDB-specific operators like $or
 */
export type MongoQuery<T> = FindOptionsWhere<T> & {
  $or?: Array<Partial<T>>;
  $and?: Array<Partial<T>>;
  $not?: Partial<T>;
};

/**
 * Type helper for TypeORM MongoDB ObjectId queries
 * TypeORM's MongoDB typing requires ObjectId fields to be cast properly
 */
export type MongoIdQuery<T> = {
  [K in keyof T]?: T[K] extends ObjectId ? ObjectId | { $eq?: ObjectId } : T[K];
};

/**
 * Helper function to create MongoDB $or queries safely
 */
export function createOrQuery<T>(conditions: Partial<T>[]): MongoQuery<T> {
  return { $or: conditions } as MongoQuery<T>;
}

/**
 * Helper to validate if a string is a valid ObjectId format
 */
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Helper to create a safe MongoDB query with ObjectId
 * Throws BadRequestException if the ID format is invalid
 */
export function createObjectIdQuery<T>(
  field: keyof T,
  id: string | ObjectId,
): FindOptionsWhere<T> {
  if (typeof id === 'string') {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ID format: ${id}`);
    }
    const objectId = new ObjectId(id);
    return { [field]: objectId } as FindOptionsWhere<T>;
  }
  return { [field]: id } as FindOptionsWhere<T>;
}

/**
 * Helper to create a safe MongoDB $in query with ObjectIds
 * Throws BadRequestException if any ID format is invalid
 */
export function createInQuery<T>(
  field: keyof T,
  ids: (string | ObjectId)[],
): FindOptionsWhere<T> {
  const objectIds = ids.map((id) => {
    if (typeof id === 'string') {
      if (!isValidObjectId(id)) {
        throw new BadRequestException(`Invalid ID format: ${id}`);
      }
      return new ObjectId(id);
    }
    return id;
  });
  return { [field]: { $in: objectIds } } as FindOptionsWhere<T>;
}
