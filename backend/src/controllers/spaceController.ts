import express from 'express';
import Space from '../models/Space';
import SpaceElement from '../models/SpaceElement';
import Reservation from '../models/Reservation';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';

export class SpaceController {

    getSpaceCount = (_req: express.Request, res: express.Response) => {
        Space.countDocuments({ status: 'active' })
            .then((count: number) => {
                res.json({ count });
            })
            .catch((error: any) => console.log(error));
    }

    getTop5 = (_req: express.Request, res: express.Response) => {
        Space.find({ status: 'active' })
            .sort({ totalLikes: -1 })
            .limit(5)
            .populate('companyId', 'name')
            .populate('managerId', 'firstName lastName')
            .then((spaces: any) => {
                res.json(spaces);
            })
            .catch((error: any) => console.log(error));
    }

    getCities = (_req: express.Request, res: express.Response) => {
        Space.distinct('city', { status: 'active' })
            .then((cities: any) => {
                res.json(cities.sort());
            })
            .catch((error: any) => console.log(error));
    }

    searchSpaces = (req: express.Request, res: express.Response) => {
        const { name, cities, elementType, minDesks } = req.query;
        const filter: Record<string, unknown> = { status: 'active' };
        if (name) filter.name = { $regex: name as string, $options: 'i' };
        if (cities) {
            const cityList = (cities as string).split(',').map((c) => c.trim()).filter(Boolean);
            if (cityList.length) filter.city = { $in: cityList };
        }

        Space.find(filter)
            .populate('companyId', 'name')
            .populate('managerId', 'firstName lastName')
            .then((spaces: any) => {
                if (!elementType) {
                    res.json(spaces);
                    return;
                }
                const elemFilter: Record<string, unknown> = { type: elementType as string };
                if (elementType === 'office' && minDesks) {
                    elemFilter.deskCount = { $gte: parseInt(minDesks as string) };
                }
                return SpaceElement.find(elemFilter).select('spaceId')
                    .then((matchingElements: any) => {
                        const matchingSpaceIds = matchingElements.map((e: any) => String(e.spaceId));
                        const filtered = spaces.filter((s: any) => matchingSpaceIds.includes(String(s._id)));
                        res.json(filtered);
                    });
            })
            .catch((error: any) => console.log(error));
    }

    getSpaceDetails = (req: express.Request, res: express.Response) => {
        Space.findById(req.params.id)
            .populate('companyId', 'name address')
            .populate('managerId', 'firstName lastName')
            .then((space: any) => {
                if (!space || space.status !== 'active') {
                    res.status(404).json({ message: 'Space not found' });
                    return;
                }
                return SpaceElement.find({ spaceId: space._id })
                    .then((elements: any) => {
                        res.json({ ...space.toObject(), elements });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    createSpace = (req: AuthRequest, res: express.Response) => {
        const { name, city, address, description, pricePerHour, latitude, longitude, maxPenalties, deskCount } = req.body;
        if (!name || !city || !address || !pricePerHour || !latitude || !longitude || !maxPenalties || !deskCount) {
            res.status(400).json({ message: 'All required fields must be filled' });
            return;
        }
        if (parseInt(deskCount) < 5) {
            res.status(400).json({ message: 'Open space must have at least 5 desks' });
            return;
        }

        const images: string[] = [];
        if (req.files && Array.isArray(req.files)) {
            req.files.forEach((f: Express.Multer.File) => images.push(`uploads/spaces/${f.filename}`));
        }

        User.findById(req.user!.id).select('companyId')
            .then((user: any) => {
                if (!user?.companyId) {
                    res.status(400).json({ message: 'Manager is not associated with a company' });
                    return;
                }
                return Space.create({
                        name, city, address, description,
                        companyId: user.companyId,
                        managerId: req.user!.id,
                        pricePerHour: parseFloat(pricePerHour),
                        status: 'pending',
                        mainImage: images[0] || '',
                        images,
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude),
                        maxPenalties: parseInt(maxPenalties),
                    }).then((space: any) => {
                        return SpaceElement.create({
                            spaceId: space._id,
                            type: 'open',
                            name: 'Open Space',
                            deskCount: parseInt(deskCount),
                        }).then(() => {
                            res.status(201).json(space);
                        });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    approveSpace = (req: AuthRequest, res: express.Response) => {
        Space.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true })
            .then((space: any) => {
                if (!space) {
                    res.status(404).json({ message: 'Space not found' });
                    return;
                }
                res.json(space);
            })
            .catch((error: any) => console.log(error));
    }

    getPendingSpaces = (_req: express.Request, res: express.Response) => {
        Space.find({ status: 'pending' })
            .populate('companyId', 'name')
            .populate('managerId', 'firstName lastName')
            .then((spaces: any) => {
                res.json(spaces);
            })
            .catch((error: any) => console.log(error));
    }

    getManagerSpaces = (req: AuthRequest, res: express.Response) => {
        User.findById(req.user!.id).select('companyId')
            .then((user: any) => {
                if (!user || !user.companyId) {
                    res.status(404).json({ message: 'Manager company not found' });
                    return;
                }
                return Space.find({ companyId: user.companyId })
                    .then((spaces: any) => {
                        return Promise.all(
                            spaces.map((s: any) => {
                                return SpaceElement.find({ spaceId: s._id })
                                    .then((elements: any) => {
                                        return { ...s.toObject(), elements };
                                    });
                            })
                        ).then((result: any) => {
                            res.json(result);
                        });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    addSpaceElement = (req: AuthRequest, res: express.Response) => {
        const { id } = req.params;
        const { type, name, deskCount, equipment } = req.body;

        Space.findById(id)
            .then((space: any) => {
                if (!space) {
                    res.status(404).json({ message: 'Space not found' });
                    return;
                }
                if (String(space.managerId) !== req.user!.id) {
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }
                if (!['office', 'conference'].includes(type)) {
                    res.status(400).json({ message: 'Type must be office or conference' });
                    return;
                }
                if (!name || !name.trim()) {
                    res.status(400).json({ message: 'Name is required' });
                    return;
                }
                if (type === 'office') {
                    if (!deskCount || parseInt(deskCount) < 1) {
                        res.status(400).json({ message: 'Desk count is required for offices' });
                        return;
                    }
                }
                if (type === 'conference' && equipment && equipment.length > 300) {
                    res.status(400).json({ message: 'Equipment description cannot exceed 300 characters' });
                    return;
                }
                return SpaceElement.findOne({ spaceId: id, name: name.trim() })
                    .then((existing: any) => {
                        if (existing) {
                            res.status(409).json({ message: 'An element with this name already exists in this space' });
                            return;
                        }
                        return SpaceElement.create({
                            spaceId: id,
                            type,
                            name: name.trim(),
                            ...(type === 'office' && { deskCount: parseInt(deskCount) }),
                            ...(type === 'conference' && { equipment: equipment?.trim() ?? '' }),
                        }).then((element: any) => {
                            res.status(201).json(element);
                        });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    getAdminStats = (_req: express.Request, res: express.Response) => {
        Space.find({ status: 'active' }).select('_id name city pricePerHour').lean()
            .then((spaces: any) => {
                return Promise.all(spaces.map((space: any) => {
                    return Reservation.find({
                        spaceId: space._id,
                        status: { $in: ['active', 'confirmed'] },
                    }).select('startTime endTime status').lean()
                        .then((reservations: any) => {
                            const reservationCount = reservations.length;
                            let revenue = 0;
                            for (const r of reservations) {
                                const hours = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / (1000 * 60 * 60);
                                revenue += hours * space.pricePerHour;
                            }
                            return {
                                spaceId: space._id,
                                name: space.name,
                                city: space.city,
                                reservationCount,
                                revenue: Math.round(revenue * 100) / 100,
                            };
                        });
                }));
            })
            .then((stats: any) => {
                res.json(stats);
            })
            .catch((error: any) => console.log(error));
    }

    updateSpace = (req: AuthRequest, res: express.Response) => {
        const { id } = req.params;
        const { name, city, address, description, pricePerHour, maxPenalties } = req.body;

        Space.findById(id)
            .then((space: any) => {
                if (!space) {
                    res.status(404).json({ message: 'Space not found' });
                    return;
                }
                if (String(space.managerId) !== req.user!.id) {
                    res.status(403).json({ message: 'Forbidden' });
                    return;
                }

                if (name) space.name = name;
                if (city) space.city = city;
                if (address) space.address = address;
                if (description !== undefined) space.description = description;
                if (pricePerHour) space.pricePerHour = parseFloat(pricePerHour);
                if (maxPenalties) space.maxPenalties = parseInt(maxPenalties);

                return space.save().then((saved: any) => {
                    res.json(saved);
                });
            })
            .catch((error: any) => console.log(error));
    }
}