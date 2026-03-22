import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Reservation from '../models/Reservation';
import { AuthRequest } from '../middleware/auth';

export class UserController {

    getProfile = (req: AuthRequest, res: express.Response) => {
        User.findById(req.user!.id).select('-password').populate('companyId')
            .then((user: any) => {
                if (!user) {
                    res.status(404).json({ message: 'User not found' });
                    return;
                }
                res.json(user);
            })
            .catch((error: any) => console.log(error));
    }

    updateProfile = (req: AuthRequest, res: express.Response) => {
        const { firstName, lastName, phone, email } = req.body;
        const userId = req.user!.id;

        const doUpdate = () => {
            const updateData: Record<string, string> = {};
            if (firstName) updateData.firstName = firstName;
            if (lastName) updateData.lastName = lastName;
            if (phone) updateData.phone = phone;
            if (email) updateData.email = email;
            if (req.file) updateData.profileImage = `uploads/profiles/${req.file.filename}`;

            return User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password')
                .then((updated: any) => {
                    res.json(updated);
                });
        };

        if (email) {
            User.findOne({ email, _id: { $ne: userId } })
                .then((existing: any) => {
                    if (existing) {
                        res.status(409).json({ message: 'Email already in use' });
                        return;
                    }
                    return doUpdate();
                })
                .catch((error: any) => console.log(error));
        } else {
            doUpdate().catch((error: any) => console.log(error));
        }
    }

    getMyReservations = (req: AuthRequest, res: express.Response) => {
        Reservation.find({ memberId: req.user!.id })
            .populate('spaceId', 'name city')
            .populate('elementId', 'name type')
            .sort({ startTime: -1 })
            .then((reservations: any) => {
                res.json(reservations);
            })
            .catch((error: any) => console.log(error));
    }

    cancelReservation = (req: AuthRequest, res: express.Response) => {
        const { id } = req.params;

        Reservation.findOne({ _id: id, memberId: req.user!.id })
            .then((reservation: any) => {
                if (!reservation) {
                    res.status(404).json({ message: 'Reservation not found' });
                    return;
                }
                if (reservation.status !== 'active') {
                    res.status(400).json({ message: 'Only active reservations can be cancelled' });
                    return;
                }
                const hoursUntilStart = (reservation.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
                if (hoursUntilStart < 12) {
                    res.status(400).json({ message: 'Cannot cancel reservations less than 12 hours before start' });
                    return;
                }
                return Reservation.findByIdAndUpdate(id, { status: 'cancelled' })
                    .then(() => {
                        res.json({ message: 'Reservation cancelled' });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    getAllUsers = (_req: express.Request, res: express.Response) => {
        User.find().select('-password').populate('companyId')
            .then((users: any) => {
                res.json(users);
            })
            .catch((error: any) => console.log(error));
    }

    getPendingUsers = (_req: express.Request, res: express.Response) => {
        User.find({ status: 'pending' }).select('-password').populate('companyId')
            .then((users: any) => {
                res.json(users);
            })
            .catch((error: any) => console.log(error));
    }

    approveUser = (req: AuthRequest, res: express.Response) => {
        User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true }).select('-password')
            .then((user: any) => {
                if (!user) {
                    res.status(404).json({ message: 'User not found' });
                    return;
                }
                res.json(user);
            })
            .catch((error: any) => console.log(error));
    }

    rejectUser = (req: AuthRequest, res: express.Response) => {
        User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true }).select('-password')
            .then((user: any) => {
                if (!user) {
                    res.status(404).json({ message: 'User not found' });
                    return;
                }
                res.json(user);
            })
            .catch((error: any) => console.log(error));
    }

    updateUser = (req: AuthRequest, res: express.Response) => {
        const { password, ...rest } = req.body;

        const doUpdate = (updateData: Record<string, unknown>) => {
            return User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password')
                .then((user: any) => {
                    if (!user) {
                        res.status(404).json({ message: 'User not found' });
                        return;
                    }
                    res.json(user);
                });
        };

        if (password) {
            bcrypt.hash(password, 10)
                .then((hashed: string) => {
                    return doUpdate({ ...rest, password: hashed });
                })
                .catch((error: any) => console.log(error));
        } else {
            doUpdate({ ...rest }).catch((error: any) => console.log(error));
        }
    }

    deleteUser = (req: AuthRequest, res: express.Response) => {
        User.findByIdAndDelete(req.params.id)
            .then((user: any) => {
                if (!user) {
                    res.status(404).json({ message: 'User not found' });
                    return;
                }
                res.json({ message: 'User deleted' });
            })
            .catch((error: any) => console.log(error));
    }
}
