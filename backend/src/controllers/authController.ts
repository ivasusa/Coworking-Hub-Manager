import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import Company from '../models/Company';
import PasswordResetToken from '../models/PasswordResetToken';

const JWT_SECRET = process.env.JWT_SECRET || 'coworking_secret_key';
const PASSWORD_REGEX = /^[a-zA-Z](?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{7,11}$/;

export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }
  const user = await User.findOne({ username, role: { $in: ['member', 'manager'] } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  if (user.status === 'pending') {
    res.status(403).json({ message: 'Account pending approval' });
    return;
  }
  if (user.status === 'rejected') {
    res.status(403).json({ message: 'Account rejected' });
    return;
  }
  if (user.status === 'blocked') {
    res.status(403).json({ message: 'Account blocked' });
    return;
  }
  const token = jwt.sign({ id: user._id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user._id, username: user.username, role: user.role, profileImage: user.profileImage } });
}

export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ message: 'Username and password required' });
    return;
  }
  const user = await User.findOne({ username, role: 'admin' });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ id: user._id, role: user.role, status: user.status }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user._id, username: user.username, role: user.role, profileImage: user.profileImage } });
}

export async function register(req: Request, res: Response): Promise<void> {
  const { username, password, firstName, lastName, phone, email, role, companyName, companyAddress, registrationNumber, taxId } = req.body;

  if (!username || !password || !firstName || !lastName || !phone || !email || !role) {
    res.status(400).json({ message: 'All required fields must be filled' });
    return;
  }
  if (!['member', 'manager'].includes(role)) {
    res.status(400).json({ message: 'Invalid role' });
    return;
  }
  if (!PASSWORD_REGEX.test(password)) {
    res.status(400).json({ message: 'Password must be 8-12 chars, start with a letter, include uppercase, number and special character' });
    return;
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    res.status(409).json({ message: 'Username already taken' });
    return;
  }
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    res.status(409).json({ message: 'Email already registered' });
    return;
  }

  let companyId;
  if (role === 'manager') {
    if (!companyName || !companyAddress || !registrationNumber || !taxId) {
      res.status(400).json({ message: 'Company details required for manager registration' });
      return;
    }
    if (!/^\d{8}$/.test(registrationNumber)) {
      res.status(400).json({ message: 'Registration number must be exactly 8 digits' });
      return;
    }
    if (!/^[1-9]\d{8}$/.test(taxId)) {
      res.status(400).json({ message: 'Tax ID must be 9 digits and not start with 0' });
      return;
    }

    let company = await Company.findOne({ registrationNumber });
    if (company) {
      if (company.managerCount >= 2) {
        res.status(409).json({ message: 'This company already has 2 managers registered' });
        return;
      }
      companyId = company._id;
    } else {
      const existingTaxId = await Company.findOne({ taxId });
      if (existingTaxId) {
        res.status(409).json({ message: 'Tax ID already registered' });
        return;
      }
      company = await Company.create({ name: companyName, address: companyAddress, registrationNumber, taxId, managerCount: 0 });
      companyId = company._id;
    }
  }

  const profileImage = req.file ? `uploads/profiles/${req.file.filename}` : 'uploads/profiles/default.png';
  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    password: hashed,
    firstName,
    lastName,
    phone,
    email,
    profileImage,
    role,
    status: 'pending',
    companyId,
  });

  if (role === 'manager' && companyId) {
    await Company.findByIdAndUpdate(companyId, { $inc: { managerCount: 1 } });
  }

  res.status(201).json({ message: 'Registration request submitted. Awaiting admin approval.', userId: user._id });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { identifier } = req.body;
  if (!identifier) {
    res.status(400).json({ message: 'Username or email required' });
    return;
  }
  const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
  if (!user) {
    res.json({ message: 'If that account exists, a reset link has been sent.' });
    return;
  }

  await PasswordResetToken.deleteMany({ userId: user._id });
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await PasswordResetToken.create({ userId: user._id, token, expiresAt, used: false });

  const resetLink = `http://localhost:4200/reset-password?token=${token}`;

  res.json({ message: 'Reset link generated successfully.', resetLink });
}

export async function verifyResetToken(req: Request, res: Response): Promise<void> {
  const { token } = req.params;
  const record = await PasswordResetToken.findOne({ token, used: false });
  if (!record || record.expiresAt < new Date()) {
    res.status(400).json({ valid: false, message: 'Token is invalid or expired' });
    return;
  }
  res.json({ valid: true });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ message: 'Token and new password required' });
    return;
  }
  if (!PASSWORD_REGEX.test(newPassword)) {
    res.status(400).json({ message: 'Password must be 8-12 chars, start with a letter, include uppercase, number and special character' });
    return;
  }
  const record = await PasswordResetToken.findOne({ token, used: false });
  if (!record || record.expiresAt < new Date()) {
    res.status(400).json({ message: 'Token is invalid or expired' });
    return;
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(record.userId, { password: hashed });
  await PasswordResetToken.findByIdAndUpdate(record._id, { used: true });
  res.json({ message: 'Password reset successfully' });
}
