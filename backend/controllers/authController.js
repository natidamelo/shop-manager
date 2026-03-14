import * as authService from '../services/authService.js';
import { AppError } from '../middleware/errorHandler.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }
    const result = await authService.login(email, password);
    res.json(result);
  } catch (err) {
    if (err.message === 'Invalid email or password') {
      return res.status(401).json({ error: err.message });
    }
    next(err);
  }
}
