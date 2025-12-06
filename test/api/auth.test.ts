import { POST as registerPOST } from '../../src/app/api/auth/register/route';
import { POST as loginPOST } from '../../src/app/api/auth/login/route';
import { supabase } from '../../src/lib/supabase';
import { HTTP_STATUS } from '../../src/lib/constants';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Mock request body
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser', password: 'password123' }),
      });

      // Mock Supabase responses
      const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null }); // No existing user
      const mockInsert = jest.fn().mockResolvedValue({ error: null });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
            insert: mockInsert,
          };
        }
        return {};
      });

      // Mock bcrypt
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const res = await registerPOST(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(body).toEqual({ message: 'User registered successfully' });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should return 409 if username already exists', async () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'existinguser', password: 'password123' }),
      });

      // Mock existing user
      const mockSingle = jest.fn().mockResolvedValue({
        data: [{ username: 'existinguser' }],
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          };
        }
        return {};
      });

      const res = await registerPOST(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(body).toEqual({ error: 'User already exists' });
    });

    it('should return 400 if fields are missing', async () => {
      const req = new Request('http://localhost/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser' }), // Missing password
      });

      const res = await registerPOST(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(body).toEqual({ error: 'Username and password are required' });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser', password: 'password123' }),
      });

      // Mock user found
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: 'user123', username: 'testuser', password: 'hashed_password' },
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          };
        }
        return {};
      });

      // Mock bcrypt compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await loginPOST(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(body).toEqual({
        user: {
          id: 'user123',
          username: 'testuser',
        },
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'testuser', password: 'wrongpassword' }),
      });

      // Mock user found
      const mockSingle = jest.fn().mockResolvedValue({
        data: { username: 'testuser', password: 'hashed_password' },
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          };
        }
        return {};
      });

      // Mock bcrypt compare false
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await loginPOST(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return 401 if user not found', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: 'nonexistent', password: 'password123' }),
      });

      // Mock user not found
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          };
        }
        return {};
      });

      const res = await loginPOST(req);
      const body = await res.json();

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(body).toEqual({ error: 'Invalid credentials' });
    });
  });
});
