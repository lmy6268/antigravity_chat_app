import { POST as createRoom } from '../../src/app/api/rooms/create/route';
import {
  GET as getRoom,
  DELETE as deleteRoom,
} from '../../src/app/api/rooms/[roomId]/route';
import { supabase } from '../../src/lib/supabase/client';
import { HTTP_STATUS } from '../../src/lib/constants/api';

// Mock dependencies
jest.mock('../../src/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Rooms API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/rooms/create', () => {
    it('should create a room successfully', async () => {
      const req = new Request('http://localhost/api/rooms/create', {
        method: 'POST',
        body: JSON.stringify({
          id: 'room123',
          name: 'Test Room',
          password: 'password',
          creator: 'user1',
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'room123',
              name: 'Test Room',
              creator_username: 'user1',
              password: 'password',
              created_at: '2023-01-01',
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const res = await createRoom(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(body.room.id).toBe('room123');
    });

    it('should return 400 if fields are missing', async () => {
      const req = new Request('http://localhost/api/rooms/create', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Room' }), // Missing id, password, creator
      });

      const res = await createRoom(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body.error).toBe('Missing required fields');
    });
  });

  describe('GET /api/rooms/[roomId]', () => {
    it('should return room info', async () => {
      const req = new Request('http://localhost/api/rooms/room123');
      const params = Promise.resolve({ roomId: 'room123' });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'room123',
              name: 'Test Room',
              creator_username: 'user1',
              password: 'password',
              created_at: '2023-01-01',
            },
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const res = await getRoom(req, { params });
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(body.room.id).toBe('room123');
    });

    it('should return 404 if room not found', async () => {
      const req = new Request('http://localhost/api/rooms/nonexistent');
      const params = Promise.resolve({ roomId: 'nonexistent' });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const res = await getRoom(req, { params });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('DELETE /api/rooms/[roomId]', () => {
    it('should delete room successfully', async () => {
      const req = new Request('http://localhost/api/rooms/room123', {
        method: 'DELETE',
      });
      const params = Promise.resolve({ roomId: 'room123' });

      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const res = await deleteRoom(req, { params });
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(body.success).toBe(true);
    });
  });
});
