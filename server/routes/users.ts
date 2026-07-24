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
    const {
      name,
      mobile,
      password,
      nationalId,
      email,
      role,
      username,
      doctorTitle,
      specialty,
      gender,
      age,
      address,
      emergencyPhone,
    } = req.body || {};
    if (!name?.trim() || !mobile?.trim() || !password) {
      res.status(400).json({ error: 'نام، موبایل و رمز عبور الزامی است' });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
      return;
    }

    const userRole: UserRole =
      role === 'admin' || role === 'doctor' || role === 'operator' || role === 'patient'
        ? role
        : 'patient';

    const normalizedMobile = String(mobile).trim();
    const existingMobile = await findUserByMobile(normalizedMobile);
    if (existingMobile) {
      res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است' });
      return;
    }

    const normalizedUsername =
      username != null && String(username).trim() ? String(username).trim().toLowerCase() : undefined;

    if (userRole !== 'patient' && !normalizedUsername) {
      res.status(400).json({ error: 'برای نقش‌های پرسنل، نام کاربری الزامی است' });
      return;
    }

    if (normalizedUsername) {
      const existingUser = await findUserByUsername(normalizedUsername);
      if (existingUser) {
        res.status(409).json({ error: 'این نام کاربری قبلاً استفاده شده است' });
        return;
      }
    }

    const idPrefix =
      userRole === 'admin'
        ? 'admin'
        : userRole === 'doctor'
          ? 'doctor'
          : userRole === 'operator'
            ? 'operator'
            : 'patient';
    const id = `${idPrefix}-${Date.now()}`;

    const record: UserRecord = {
      id,
      name: String(name).trim(),
      mobile: normalizedMobile,
      role: userRole,
      username: normalizedUsername,
      nationalId: nationalId ? String(nationalId).trim() : undefined,
      email: email ? String(email).trim() : undefined,
      doctorTitle: doctorTitle ? String(doctorTitle).trim() : undefined,
      specialty: specialty ? String(specialty).trim() : undefined,
      gender: gender === 'female' || gender === 'male' ? gender : undefined,
      age: typeof age === 'number' && Number.isFinite(age) ? age : undefined,
      address: address ? String(address).trim() : undefined,
      emergencyPhone: emergencyPhone ? String(emergencyPhone).trim() : undefined,
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
    if (body.password && String(body.password).trim() && String(body.password).length < 6) {
      res.status(400).json({ error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' });
      return;
    }

    const nextRole: UserRole =
      body.role === 'admin' ||
      body.role === 'doctor' ||
      body.role === 'operator' ||
      body.role === 'patient'
        ? body.role
        : existing.role;

    const nextMobile =
      body.mobile != null ? String(body.mobile).trim() : existing.mobile;
    if (nextMobile && nextMobile !== existing.mobile) {
      const taken = await findUserByMobile(nextMobile);
      if (taken && taken.id !== id) {
        res.status(409).json({ error: 'این شماره موبایل قبلاً ثبت شده است' });
        return;
      }
    }

    const nextUsername =
      body.username != null
        ? String(body.username).trim()
          ? String(body.username).trim().toLowerCase()
          : undefined
        : existing.username;

    if (nextRole !== 'patient' && !nextUsername) {
      res.status(400).json({ error: 'برای نقش‌های پرسنل، نام کاربری الزامی است' });
      return;
    }

    if (nextUsername && nextUsername !== (existing.username || '').toLowerCase()) {
      const taken = await findUserByUsername(nextUsername);
      if (taken && taken.id !== id) {
        res.status(409).json({ error: 'این نام کاربری قبلاً استفاده شده است' });
        return;
      }
    }

    const nextPassword =
      body.password && String(body.password).trim()
        ? hashPassword(String(body.password))
        : existing.passwordHash;

    const updated: UserRecord = {
      ...existing,
      id,
      passwordHash: nextPassword,
      role: nextRole,
      mobile: nextMobile,
      username: nextUsername,
      name: body.name != null ? String(body.name).trim() : existing.name,
      email: body.email != null ? String(body.email).trim() || undefined : existing.email,
      nationalId:
        body.nationalId != null
          ? String(body.nationalId).trim() || undefined
          : existing.nationalId,
      doctorTitle:
        body.doctorTitle != null
          ? String(body.doctorTitle).trim() || undefined
          : existing.doctorTitle,
      specialty:
        body.specialty != null
          ? String(body.specialty).trim() || undefined
          : existing.specialty,
      gender:
        body.gender === 'female' || body.gender === 'male'
          ? body.gender
          : body.gender === ''
            ? undefined
            : existing.gender,
      age:
        body.age === '' || body.age === null
          ? undefined
          : typeof body.age === 'number' && Number.isFinite(body.age)
            ? body.age
            : existing.age,
      address:
        body.address != null ? String(body.address).trim() || undefined : existing.address,
      emergencyPhone:
        body.emergencyPhone != null
          ? String(body.emergencyPhone).trim() || undefined
          : existing.emergencyPhone,
      avatar: body.avatar != null ? String(body.avatar).trim() || undefined : existing.avatar,
    };

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
