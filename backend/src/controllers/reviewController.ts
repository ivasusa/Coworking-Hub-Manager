import express from 'express';
import { AuthRequest } from '../middleware/auth';
import Review from '../models/Review';
import Reservation from '../models/Reservation';
import Space from '../models/Space';

export class ReviewController {

    getSpaceReviews = (req: express.Request, res: express.Response) => {
        const { spaceId } = req.params;

        Review.find({ spaceId }).populate('memberId', 'username')
            .then((allReviews: any) => {
                const allComments: { text: string; createdAt: Date; username: string; memberId: string }[] = [];
                for (const r of allReviews) {
                    const user = r.memberId as any;
                    for (const c of r.comments) {
                        allComments.push({
                            text: c.text,
                            createdAt: c.createdAt,
                            username: user?.username ?? 'Unknown',
                            memberId: String(r.memberId),
                        });
                    }
                }
                allComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                const last10 = allComments.slice(0, 10);

                const authReq = req as AuthRequest;
                if (!authReq.user) {
                    res.json({ comments: last10, memberReview: null, confirmedCount: 0 });
                    return;
                }

                return Review.findOne({ memberId: authReq.user.id, spaceId })
                    .then((review: any) => {
                        return Reservation.countDocuments({
                            memberId: authReq.user!.id,
                            spaceId,
                            status: 'confirmed',
                        }).then((confirmedCount: number) => {
                            const memberReview = review ? {
                                likeCount: review.likeCount,
                                dislikeCount: review.dislikeCount,
                                commentCount: review.comments.length,
                            } : null;
                            res.json({ comments: last10, memberReview, confirmedCount });
                        });
                    });
            })
            .catch((error: any) => console.log(error));
    }

    addLike = (req: AuthRequest, res: express.Response) => {
        const { spaceId } = req.params;
        const memberId = req.user!.id;

        Reservation.countDocuments({ memberId, spaceId, status: 'confirmed' })
            .then((confirmedCount: number) => {
                if (confirmedCount === 0) {
                    res.status(403).json({ message: 'You need at least one confirmed reservation to leave a review' });
                    return;
                }
                return Review.findOneAndUpdate(
                    { memberId, spaceId },
                    { $setOnInsert: { memberId, spaceId } },
                    { upsert: true, new: true }
                ).then((review: any) => {
                    if (review.likeCount + review.dislikeCount >= confirmedCount) {
                        res.status(403).json({ message: 'You have reached your reaction limit for this space' });
                        return;
                    }
                    review.likeCount += 1;
                    return review.save().then(() => {
                        return Space.findByIdAndUpdate(spaceId, { $inc: { totalLikes: 1 } })
                            .then(() => {
                                res.json({ likeCount: review.likeCount, dislikeCount: review.dislikeCount, commentCount: review.comments.length });
                            });
                    });
                });
            })
            .catch((error: any) => console.log(error));
    }

    addDislike = (req: AuthRequest, res: express.Response) => {
        const { spaceId } = req.params;
        const memberId = req.user!.id;

        Reservation.countDocuments({ memberId, spaceId, status: 'confirmed' })
            .then((confirmedCount: number) => {
                if (confirmedCount === 0) {
                    res.status(403).json({ message: 'You need at least one confirmed reservation to leave a review' });
                    return;
                }
                return Review.findOneAndUpdate(
                    { memberId, spaceId },
                    { $setOnInsert: { memberId, spaceId } },
                    { upsert: true, new: true }
                ).then((review: any) => {
                    if (review.likeCount + review.dislikeCount >= confirmedCount) {
                        res.status(403).json({ message: 'You have reached your reaction limit for this space' });
                        return;
                    }
                    review.dislikeCount += 1;
                    return review.save().then(() => {
                        return Space.findByIdAndUpdate(spaceId, { $inc: { totalDislikes: 1 } })
                            .then(() => {
                                res.json({ likeCount: review.likeCount, dislikeCount: review.dislikeCount, commentCount: review.comments.length });
                            });
                    });
                });
            })
            .catch((error: any) => console.log(error));
    }

    addComment = (req: AuthRequest, res: express.Response) => {
        const { spaceId } = req.params;
        const { text } = req.body;
        const memberId = req.user!.id;

        if (!text || !text.trim()) {
            res.status(400).json({ message: 'Comment text is required' });
            return;
        }

        Reservation.countDocuments({ memberId, spaceId, status: 'confirmed' })
            .then((confirmedCount: number) => {
                if (confirmedCount === 0) {
                    res.status(403).json({ message: 'You need at least one confirmed reservation to leave a review' });
                    return;
                }
                return Review.findOneAndUpdate(
                    { memberId, spaceId },
                    { $setOnInsert: { memberId, spaceId } },
                    { upsert: true, new: true }
                ).then((review: any) => {
                    if (review.comments.length >= confirmedCount) {
                        res.status(403).json({ message: 'You have reached your comment limit for this space' });
                        return;
                    }
                    review.comments.push({ text: text.trim(), createdAt: new Date() });
                    return review.save().then((saved: any) => {
                        res.json({ likeCount: saved.likeCount, dislikeCount: saved.dislikeCount, commentCount: saved.comments.length });
                    });
                });
            })
            .catch((error: any) => console.log(error));
    }
}
