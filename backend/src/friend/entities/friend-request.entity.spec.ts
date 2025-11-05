import { ObjectId } from 'mongodb';
import { FriendRequest, FriendRequestStatus } from './friend-request.entity';

describe('FriendRequest Entity', () => {
  let friendRequest: FriendRequest;

  beforeEach(() => {
    friendRequest = new FriendRequest();
  });

  describe('Entity Structure', () => {
    it('should be defined', () => {
      expect(friendRequest).toBeDefined();
    });

    it('should have all required properties', () => {
      const senderId = new ObjectId();
      const receiverId = new ObjectId();

      friendRequest._id = new ObjectId();
      friendRequest.senderId = senderId;
      friendRequest.receiverId = receiverId;
      friendRequest.status = FriendRequestStatus.PENDING;
      friendRequest.createdAt = new Date();
      friendRequest.updatedAt = new Date();

      expect(friendRequest._id).toBeInstanceOf(ObjectId);
      expect(friendRequest.senderId).toEqual(senderId);
      expect(friendRequest.receiverId).toEqual(receiverId);
      expect(friendRequest.status).toBe(FriendRequestStatus.PENDING);
      expect(friendRequest.createdAt).toBeInstanceOf(Date);
      expect(friendRequest.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('FriendRequestStatus Enum', () => {
    it('should have PENDING status', () => {
      expect(FriendRequestStatus.PENDING).toBe('pending');
    });

    it('should have ACCEPTED status', () => {
      expect(FriendRequestStatus.ACCEPTED).toBe('accepted');
    });

    it('should have REJECTED status', () => {
      expect(FriendRequestStatus.REJECTED).toBe('rejected');
    });
  });

  describe('setCreateTimestamp', () => {
    it('should set createdAt and updatedAt timestamps', () => {
      const beforeTime = new Date();
      friendRequest.setCreateTimestamp();
      const afterTime = new Date();

      expect(friendRequest.createdAt).toBeDefined();
      expect(friendRequest.updatedAt).toBeDefined();
      expect(friendRequest.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeTime.getTime(),
      );
      expect(friendRequest.createdAt.getTime()).toBeLessThanOrEqual(
        afterTime.getTime(),
      );
      expect(friendRequest.updatedAt).toEqual(friendRequest.createdAt);
    });

    it('should set default status to PENDING if not set', () => {
      friendRequest.setCreateTimestamp();

      expect(friendRequest.status).toBe(FriendRequestStatus.PENDING);
    });

    it('should not override existing status', () => {
      friendRequest.status = FriendRequestStatus.ACCEPTED;
      friendRequest.setCreateTimestamp();

      expect(friendRequest.status).toBe(FriendRequestStatus.ACCEPTED);
    });
  });

  describe('updateTimestamp', () => {
    it('should update updatedAt timestamp', () => {
      const initialDate = new Date('2024-01-01');
      friendRequest.createdAt = initialDate;
      friendRequest.updatedAt = initialDate;

      const beforeUpdate = new Date();
      friendRequest.updateTimestamp();
      const afterUpdate = new Date();

      expect(friendRequest.updatedAt).toBeDefined();
      expect(friendRequest.updatedAt.getTime()).toBeGreaterThanOrEqual(
        beforeUpdate.getTime(),
      );
      expect(friendRequest.updatedAt.getTime()).toBeLessThanOrEqual(
        afterUpdate.getTime(),
      );
      expect(friendRequest.updatedAt.getTime()).toBeGreaterThan(
        initialDate.getTime(),
      );
    });

    it('should not modify createdAt', () => {
      const initialDate = new Date('2024-01-01');
      friendRequest.createdAt = initialDate;

      friendRequest.updateTimestamp();

      expect(friendRequest.createdAt).toEqual(initialDate);
    });
  });

  describe('Status Transitions', () => {
    it('should allow status change from PENDING to ACCEPTED', () => {
      friendRequest.status = FriendRequestStatus.PENDING;
      friendRequest.status = FriendRequestStatus.ACCEPTED;

      expect(friendRequest.status).toBe(FriendRequestStatus.ACCEPTED);
    });

    it('should allow status change from PENDING to REJECTED', () => {
      friendRequest.status = FriendRequestStatus.PENDING;
      friendRequest.status = FriendRequestStatus.REJECTED;

      expect(friendRequest.status).toBe(FriendRequestStatus.REJECTED);
    });
  });
});
