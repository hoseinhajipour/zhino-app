import { Router, Request, Response } from 'express';
import {
  deleteEntity,
  findUserByMobile,
  findUserByUsername,
  getEntity,
  listEntities,
  upsertEntity,
} from '../db';
import { hashPassword, verifyPassword } from '../lib/password';
import type { UserProfile, UserRecord, UserRole } from '../../src/types';

export function toPublicUser(user: Record<string, unknown> | UserRecord): UserProfile {
  const { passwordHash: _pw, ...rest } = user as UserRecord & Record<string, unknown>;
  return rest as UserProfile;
}

export const usersRouter = Router();

usersRouter.get('/', async (_req, res) => {
  try {
    const users = await listEntities<UserRecord>('users');
    res.json(users.map((u) => toPublicUser(u)));
  } catch (err) {
    console.error('GET /users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

usersRouter.get('/:id', async (req, res) => {
  try {
    const user = await getEntity<UserRecord>('users', req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(toPublicUser(user));
  } catch (err) {
    console.error('GET /users/:id error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

usersRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, mobile, password, nationalId, email, role } = req.body || {};
    if (!name?.trim() || !mobile?.trim() || !password) {
      res.status(400).json({ error: 'name, mobile and password are required' });
      return;
    }

    const normalizedMobile = String(mobile).trim();
    const existing = await findUserByMobile(normalizedMobile);
    if (existing) {
      res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است' });
      return;
    }

    const userRole: UserRole = role === 'admin' || role === 'doctor' || role === 'operator' ? role : 'patient';
    const id = `patient-${Date.now()}`;
    const record: UserRecord = {
      id,
      name: String(name).trim(),
      mobile: normalizedMobile,
      role: userRole,
      nationalId: nationalId ? String(nationalId).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      passwordHash: hashPassword(String(password)),
    };

    await upsertEntity('users', id, record);
    res.status(201).json(toPublicUser(record));
  } catch (err) {
    console.error('POST /users/register error:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

usersRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { mobile, username, password, role } = req.body || {};
    if (!password) {
      res.status(400).json({ error: 'password is required' });
      return;
    }

    let user: Record<string, unknown> | null = null;
    if (username?.trim()) {
      user = await findUserByUsername(String(username));
    } else if (mobile?.trim()) {
      user = await findUserByMobile(String(mobile));
    } else {
      res.status(400).json({ error: 'mobile or username is required' });
      return;
    }

    if (!user || !verifyPassword(String(password), String(user.passwordHash || ''))) {
      res.status(401).json({ error: 'نام کاربری یا رمز عبور نادرست است' });
      return;
    }

    if (role && user.role !== role) {
      res.status(401).json({ error: 'نقش انتخاب‌شده با حساب کاربری مطابقت ندارد' });
      return;
    }

    res.json(toPublicUser(user));
  } catch (err) {
    console.error('POST /users/login error:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

usersRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const existing = await getEntity<UserRecord>('users', id);
    if (!existing) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const body = req.body || {};
    const nextPassword =
      body.password && String(body.password).trim()
        ? hashPassword(String(body.password))
        : existing.passwordHash;

    const updated: UserRecord = {
      ...existing,
      ...body,
      id,
      passwordHash: nextPassword,
      role: (body.role as UserRole) || existing.role,
      mobile: body.mobile != null ? String(body.mobile).trim() : existing.mobile,
      username: body.username != null ? String(body.username).trim() : existing.username,
      name: body.name != null ? String(body.name).trim() : existing.name,
    };
    delete (updated as unknown as Record<string, unknown>).password;

    await upsertEntity('users', id, updated);
    res.json(toPublicUser(updated));
  } catch (err) {
    console.error('PUT /users/:id error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

usersRouter.delete('/:id', async (req, res) => {
  try {
    const ok = await deleteEntity('users', req.params.id);
    if (!ok) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error('DELETE /users/:id error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
