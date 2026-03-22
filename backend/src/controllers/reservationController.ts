import express from 'express';
import { AuthRequest } from '../middleware/auth';
import Reservation from '../models/Reservation';
import Space from '../models/Space';
import SpaceElement from '../models/SpaceElement';
import Penalty from '../models/Penalty';

export class ReservationController {

    createReservation = (req: AuthRequest, res: express.Response) => {
        const { spaceId, elementId, startTime, endTime } = req.body;
        if (!spaceId || !elementId || !startTime || !endTime) {
            res.status(400).json({ message: 'All fields are required' });
            return;
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (start >= end) {
            res.status(400).json({ message: 'Start time must be before end time' });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);

        if (startDay < today) {
            res.status(400).json({ message: 'Reservation cannot be in the past' });
            return;
        }
        Space.findById(spaceId)
            .then((space: any) => {
                if (!space || space.status !== 'active') {
                    res.status(404).json({ message: 'Space not found' });
                    return;
                }
                return SpaceElement.findOne({ _id: elementId, spaceId })
                    .then((element: any) => {
                        if (!element) {
                            res.status(404).json({ message: 'Space element not found' });
                            return;
                        }
                        return Penalty.findOne({ memberId: req.user!.id, spaceId })
                            .then((penalty: any) => {
                                if (penalty && penalty.count >= space.maxPenalties) {
                                    res.status(403).json({ message: 'You are blocked from booking this space due to penalties' });
                                    return;
                                }
                                return Reservation.findOne({
                                    memberId: req.user!.id,
                                    elementId,
                                    status: { $in: ['active', 'confirmed'] },
                                    startTime: { $lt: end },
                                    endTime: { $gt: start },
                                }).then((memberAlreadyBooked: any) => {
                                    if (memberAlreadyBooked) {
                                        res.status(409).json({ message: 'You already have a reservation for this element in this period' });
                                        return;
                                    }
                                    return Reservation.countDocuments({
                                        elementId,
                                        status: { $in: ['active', 'confirmed'] },
                                        startTime: { $lt: end },
                                        endTime: { $gt: start },
                                    }).then((overlappingCount: number) => {
                                        if (element.type === 'open') {
                                            if (overlappingCount >= (element.deskCount ?? 1)) {
                                                res.status(409).json({ message: 'All desks are fully booked for this period' });
                                                return;
                                            }
                                        } else {
                                            if (overlappingCount > 0) {
                                                res.status(409).json({ message: 'This time slot is already booked' });
                                                return;
                                            }
                                        }
                                        return Reservation.create({
                                            memberId: req.user!.id,
                                            spaceId,
                                            elementId,
                                            startTime: start,
                                            endTime: end,
                                            status: 'active',
                                        }).then((reservation: any) => {
                                            res.status(201).json(reservation);
                                        });
                                    });
                                });
                            });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    getElementCalendar = (req: AuthRequest, res: express.Response) => {
        const { elementId } = req.params;
        const { weekStart } = req.query;

        const start = weekStart ? new Date(weekStart as string) : (() => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - d.getDay() + 1);
            return d;
        })();

        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        SpaceElement.findById(elementId).select('type deskCount')
            .then((element: any) => {
                return Reservation.find({
                    elementId,
                    status: { $in: ['active', 'confirmed'] },
                    startTime: { $lt: end },
                    endTime: { $gt: start },
                }).select('startTime endTime')
                    .then((reservations: any) => {
                        res.json({ element, reservations });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    getManagerReservations = (req: AuthRequest, res: express.Response) => {
        Space.find({ managerId: req.user!.id }).select('_id name')
            .then((spaces: any) => {
                const spaceIds = spaces.map((s: any) => s._id);
                return Reservation.find({ spaceId: { $in: spaceIds } })
                    .populate('memberId', 'username firstName lastName')
                    .populate('spaceId', 'name city')
                    .populate('elementId', 'name type')
                    .sort({ startTime: 1 })
                    .then((reservations: any) => {
                        res.json(reservations);
                    });
            })
            .catch((error: any) => console.log(error));
    }

    confirmReservation = (req: AuthRequest, res: express.Response) => {
        Reservation.findById(req.params.id).populate('spaceId')
            .then((reservation: any) => {
                if (!reservation) {
                    res.status(404).json({ message: 'Reservation not found' });
                    return;
                }

                const space = reservation.spaceId as any;
                if (String(space.managerId) !== req.user!.id) {
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }

                if (reservation.status !== 'active') {
                    res.status(400).json({ message: 'Only active reservations can be confirmed' });
                    return;
                }

                const tenMinutesAfterStart = new Date(reservation.startTime.getTime() + 10 * 60 * 1000);
                if (new Date() < tenMinutesAfterStart) {
                    res.status(400).json({ message: 'Cannot confirm before 10 minutes after start time' });
                    return;
                }

                reservation.status = 'confirmed';
                return reservation.save().then((saved: any) => {
                    res.json(saved);
                });
            })
            .catch((error: any) => console.log(error));
    }

    getManagerMonthlyReport = (req: AuthRequest, res: express.Response) => {
        const { month } = req.query;
        if (!month || !/^\d{4}-\d{2}$/.test(month as string)) {
            res.status(400).json({ message: 'Provide month in YYYY-MM format' });
            return;
        }

        const [year, mon] = (month as string).split('-').map(Number);
        const monthStart = new Date(year, mon - 1, 1);
        const monthEnd = new Date(year, mon, 1);
        const daysInMonth = (monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);
        const workingHoursPerDay = 12;

        Space.find({ managerId: req.user!.id }).select('_id name city')
            .then((spaces: any) => {
                const spaceIds = spaces.map((s: any) => s._id);
                return SpaceElement.find({ spaceId: { $in: spaceIds } })
                    .then((elements: any) => {
                        return Promise.all(
                            spaces.map((space: any) => {
                                const spaceElements = elements.filter((e: any) => String(e.spaceId) === String(space._id));
                                return Promise.all(
                                    spaceElements.map((el: any) => {
                                        return Reservation.find({
                                            elementId: el._id,
                                            status: { $in: ['active', 'confirmed'] },
                                            startTime: { $lt: monthEnd },
                                            endTime: { $gt: monthStart },
                                        }).then((reservations: any) => {
                                            let bookedHours = 0;
                                            for (const r of reservations) {
                                                const s = new Date(Math.max(r.startTime.getTime(), monthStart.getTime()));
                                                const e = new Date(Math.min(r.endTime.getTime(), monthEnd.getTime()));
                                                bookedHours += (e.getTime() - s.getTime()) / (1000 * 60 * 60);
                                            }
                                            const capacity = workingHoursPerDay * daysInMonth * (el.type === 'open' ? (el.deskCount ?? 1) : 1);
                                            const utilization = capacity > 0 ? Math.min((bookedHours / capacity) * 100, 100) : 0;
                                            return {
                                                name: el.name,
                                                type: el.type,
                                                deskCount: el.deskCount ?? null,
                                                bookedHours: Math.round(bookedHours * 10) / 10,
                                                capacityHours: Math.round(capacity * 10) / 10,
                                                utilization: Math.round(utilization * 10) / 10,
                                            };
                                        });
                                    })
                                ).then((elementStats: any) => {
                                    return { name: space.name, city: space.city, elements: elementStats };
                                });
                            })
                        );
                    })
                    .then((result: any) => {
                        res.json({ month: month as string, daysInMonth, spaces: result });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    getManagerElementCalendar = (req: AuthRequest, res: express.Response) => {
        const { elementId } = req.params;
        const { weekStart } = req.query;

        SpaceElement.findById(elementId)
            .then((element: any) => {
                if (!element) {
                    res.status(404).json({ message: 'Element not found' });
                    return;
                }
                return Space.findOne({ _id: element.spaceId, managerId: req.user!.id })
                    .then((space: any) => {
                        if (!space) {
                            res.status(403).json({ message: 'Forbidden' });
                            return;
                        }

                        const start = weekStart ? new Date(weekStart as string) : (() => {
                            const d = new Date();
                            d.setHours(0, 0, 0, 0);
                            d.setDate(d.getDate() - d.getDay() + 1);
                            return d;
                        })();
                        const end = new Date(start);
                        end.setDate(end.getDate() + 7);

                        return Reservation.find({
                            elementId,
                            status: { $in: ['active', 'confirmed', 'no_show'] },
                            startTime: { $lt: end },
                            endTime: { $gt: start },
                        })
                            .populate('memberId', 'username firstName lastName')
                            .select('startTime endTime status memberId')
                            .sort({ startTime: 1 })
                            .then((reservations: any) => {
                                res.json({
                                    element: { _id: element._id, name: element.name, type: element.type, deskCount: element.deskCount },
                                    space: { name: space.name },
                                    reservations,
                                });
                            });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    noShowReservation = (req: AuthRequest, res: express.Response) => {
        Reservation.findById(req.params.id).populate('spaceId')
            .then((reservation: any) => {
                if (!reservation) {
                    res.status(404).json({ message: 'Reservation not found' });
                    return;
                }

                const space = reservation.spaceId as any;
                if (String(space.managerId) !== req.user!.id) {
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }

                if (reservation.status !== 'active') {
                    res.status(400).json({ message: 'Only active reservations can be marked as no-show' });
                    return;
                }

                const tenMinutesAfterStart = new Date(reservation.startTime.getTime() + 10 * 60 * 1000);
                if (new Date() < tenMinutesAfterStart) {
                    res.status(400).json({ message: 'Cannot mark no-show before 10 minutes after start time' });
                    return;
                }

                reservation.status = 'no_show';
                return reservation.save()
                    .then((saved: any) => {
                        return Penalty.findOneAndUpdate(
                            { memberId: saved.memberId, spaceId: saved.spaceId },
                            { $inc: { count: 1 } },
                            { upsert: true, new: true }
                        ).then(() => {
                            res.json(saved);
                        });
                    });
            })
            .catch((error: any) => console.log(error));
    }
}
