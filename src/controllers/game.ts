import Express, {NextFunction} from 'express';
import {matchedData, resultOrNotFound} from '../utils/defaultImports';
import Server from '../server';
import {IModels} from '../db/core';
import {IGroupGameDocument} from '../db/interfaces/IGroupGame';
import {Types} from 'mongoose';
import {ObjectId, ObjectID} from 'bson';
import {IPurchaseHistoryDocument} from '../db/interfaces/IPurchaseHistory';
import {Logger} from 'winston';
import DocumentArray = Types.DocumentArray;

export default class GameController {
    private models: IModels;
    private logger: Logger;

    constructor(server: Server) {
        this.models = server.dbCore.models;
        this.logger = server.logger;
    }

    createGroup = (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const groupData = matchedData(req, {locations: ['body']});

        const groupGame = new this.models.GroupGame({...groupData});

        groupGame.save()
            .then(group => res.status(201).json({message: 'Group created!!'}))
            .catch(next);
    };

    getGameGroups = (req: Express.Request, res: Express.Response, next: NextFunction) => {

        this.models.GroupGame.aggregate([
            {
                $project: {
                    initialInvertion: 1,
                    enabled: 1,
                    winners: 1,
                    totalInvested: 1,
                    totalMembers: {$cond: {if: {$isArray: '$members'}, then: {$size: '$members'}, else: 'NA'}}
                }
            }
        ]).sort({initialInvertion: 1})
            .exec()
            .then((groups: Types.DocumentArray<IGroupGameDocument>) => res.status(200).json(groups))
            .catch(next);
    };

    getGroupMembers = (req: Express.Request, res: Express.Response, next: (err?: any) => void) => {
        const groupId = req.params.groupId;

        this.models.GroupGame
        // .aggregate([
        //     {$unwind: "$members"},
        //     {$sort: {"members.createdAt": 1}},
        //     {$group: {_id: "$_id", totalInvested: {$first: "totalInvested"}, winners: {$first: "$winners"}, totalMembers: { $sum: 1 }, initialInvertion: {$first: "$initialInvertion"},members: {$push: "$members"}}},
        //     // {$addFields: {"members.$[].position": {$sum: 1}}},
        //     // {$group:{_id:{age: "$age"}, allHobbies: {$push: "$hobbies"}}},
        // ])
            .findById(groupId)
            .then(group => resultOrNotFound(res, group, 'Group'))
            .catch(next);
    };

    addMemberToGroup = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const relationData = matchedData(req);

        this.models.GroupGame.findById(relationData.groupId)
            .then(group => {
                if (!group) {
                    throw ({status: 404, message: 'Group not found!'});
                }
                console.log(group);
                return group.addMember({
                    userId: req.user._id
                    , userName: req.user.userName
                    , image: req.user.image
                }, relationData.payReference);
            })
            .then(result => {
                res.status(201)
                    .json({message: 'Successful member added!'});
                // TODO: validate group member moviment
                // this.socketMng.gameGroups.
            })
            .catch(next);
    };

    removeMemberFromGroup = (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const relationData = matchedData(req);

        this.models.GroupGame.findById(relationData.groupId)
            .then(group => {
                if (!group) {
                    throw ({status: 404, message: 'Group not found!'});
                }
                return group.removeMember(relationData.userId);
            })
            .then(group => res.status(200).json({message: 'Member was removed from group!'}))
            .catch(next);
    };

    getOwnPurchaseHistory = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        console.log(req.user);
        req.user.getPurchaseHistory()
            .then((history: DocumentArray<IPurchaseHistoryDocument>) => res.status(200).json(history))
            .catch(next);
    };

    getPurchaseHistory = (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const userId = req.params.userId;
        this.models.User.findById(userId)
            .then(user => {

                if (!user) {
                    throw {status: 404, message: 'User not found!'};
                }

                return user.getPurchaseHistoryById(userId);
            })
            .then(history => res.status(200).json(history))
            .catch(next);
    };
    getMyCurrentsGroups = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        this.getGroupsByUser(req.user._id, res, next);
    };
    getCurrentGroups = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {userId} = matchedData(req);
        this.getGroupsByUser(userId, res, next);
    };

    getGroupWinnersTop = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {quantity, groupId} = req.params;
        console.log(req.params)
        this.models.PurchaseHistory
            .aggregate([
                {$match: {action: 'win', groupId: new ObjectId(groupId)}}, // agregale el id del grupo si queres para mas seguridad y me confirmas o me decis que cambiar
                {$limit: +quantity},
                {$sort: {createdAt: -1}},
                {$lookup: {from: 'users', localField: 'userId', foreignField: '_id', as: 'userInfo'}},
                {$unwind: {path: '$userInfo', preserveNullAndEmptyArrays: true}},
                {
                    $lookup: {
                        from: 'groupgames',
                        localField: 'groupId',
                        foreignField: '_id',
                        as: 'groupInfo'
                    }
                },
                {$unwind: {path: '$groupInfo', preserveNullAndEmptyArrays: true}},
                {$project: {'groupInfo.members': 0}},
                {
                    $project: {
                        'groupId': 1,
                        'createdAt': 1,
                        'userInfo': 1,
                        'quantity': 1,
                        'initialInvertion': '$groupInfo.initialInvertion',
                        'winners': '$groupInfo.winners',
                        'totalInvested': '$groupInfo.totalInvested'
                    }
                },
                {
                    $group: {
                        _id: '$groupId',
                        initialInvertion: {
                            $first: '$initialInvertion'
                        },
                        lastWinners: {
                            $push: {
                                _id: '$userInfo._id',
                                userName: '$userInfo.userName',
                                image: '$userInfo.image',
                                winDate: '$createdAt',
                                quantity: '$quantity'
                            }
                        },

                    }
                },
            ])
            .exec()
            .then((result: any) => {
                res.status(200)
                    .json(result);
                console.log(result);
            })
            .catch((err: Error) => {
                res.status(500).json(err);
            });
    };

    private getGroupsByUser(userId: string | ObjectID, res: Express.Response, next: NextFunction) {
        console.log('Searching by userID: ' + userId);
        this.models.GroupGame.find({'members.userId': new ObjectID(userId)})
            .then(groups => {
                res.status(200)
                    .json(groups);
            })
            .catch(next);
    }
}
