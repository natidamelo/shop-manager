import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export async function getUsers(req, res, next) {
    try {
        const users = await User.find().select('-password_hash').sort({ name: 1 });
        res.json(users);
    } catch (err) {
        next(err);
    }
}

export async function createUser(req, res, next) {
    try {
        const { email, password, name, role } = req.body;

        const existing = await User.findOne({ email });
        if (existing) throw new AppError('Email already in use', 400);

        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password_hash, name, role });

        const userObj = user.toJSON();
        delete userObj.password_hash;
        res.status(201).json(userObj);
    } catch (err) {
        next(err);
    }
}

export async function updateUser(req, res, next) {
    try {
        const { email, name, role } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { email, name, role },
            { new: true, runValidators: true }
        ).select('-password_hash');

        if (!user) throw new AppError('User not found', 404);
        res.json(user);
    } catch (err) {
        next(err);
    }
}

export async function updatePassword(req, res, next) {
    try {
        const { password } = req.body;
        if (!password || password.length < 6) {
            throw new AppError('Password must be at least 6 characters', 400);
        }

        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password_hash },
            { new: true }
        );

        if (!user) throw new AppError('User not found', 404);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        next(err);
    }
}

export async function deleteUser(req, res, next) {
    try {
        if (req.params.id === req.user.id) {
            throw new AppError('You cannot delete your own account', 400);
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) throw new AppError('User not found', 404);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}
