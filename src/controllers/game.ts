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
import catchAsync from '../utils/catchAsync';

export default class GameController {
    private models: IModels;
    private logger: Logger;

    constructor(server: Server) {
        this.models = server.dbCore.models;
        this.logger = server.logger;
    }

    createGroup = catchAsync( async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const groupData = matchedData(req, {locations: ['body']});

        const groupGame = new this.models.GroupGame({...groupData});

        const group = await groupGame.save()

        res.status(201).json({message: 'Group created!!'});
    });

    getGameGroups = catchAsync( async (req: Express.Request, res: Express.Response, next: NextFunction) => {

        const groups:Types.DocumentArray<IGroupGameDocument> = await this.models.GroupGame.aggregate([
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
            .exec();

        res.status(200).json(groups)
    });

    getGroupMembers = catchAsync( async (req: Express.Request, res: Express.Response, next: (err?: any) => void) => {
        const groupId = req.params.groupId;

        const group = await this.models.GroupGame
        // .aggregate([
        //     {$unwind: "$members"},
        //     {$sort: {"members.createdAt": 1}},
        //     {$group: {_id: "$_id", totalInvested: {$first: "totalInvested"}, winners: {$first: "$winners"}, totalMembers: { $sum: 1 }, initialInvertion: {$first: "$initialInvertion"},members: {$push: "$members"}}},
        //     // {$addFields: {"members.$[].position": {$sum: 1}}},
        //     // {$group:{_id:{age: "$age"}, allHobbies: {$push: "$hobbies"}}},
        // ])
            .findById(groupId);

         resultOrNotFound(res, group, 'Group');
    });

    addMemberToGroup = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const relationData = matchedData(req);

        const group = await this.models.GroupGame.findById(relationData.groupId)
        if (!group) {
            throw ({status: 404, message: 'Grupo no encontrado!'});
        }
        console.log(group);
        const result = await group.addMember({
            userId: req.user._id
            , userName: req.user.userName
            , image: req.user.image
        }, relationData.payReference);

        res.status(201)
            .json({message: 'Miembro añadido exitosamente!'});
                // TODO: validate group member moviment
    });

    removeMemberFromGroup = catchAsync( async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const relationData = matchedData(req);

        let group = await this.models.GroupGame.findById(relationData.groupId)
        if (!group) {
            throw ({status: 404, message: 'Grupo no encontrado!'});
        }
        await group.removeMember(relationData.userId);
        res.status(200).json({message: 'Miembro fue removido del grupo!'})
    });

    getOwnPurchaseHistory = catchAsync( async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        console.log(req.user);
        const history:DocumentArray<IPurchaseHistoryDocument> = await req.user.getPurchaseHistory()
            res.status(200).json(history);
    });

    getPurchaseHistory = catchAsync(async (req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const userId = req.params.userId;
        const user = await this.models.User.findById(userId)

        if (!user) {
            throw {status: 404, message: 'User not found!'};
        }

        const history = await user.getPurchaseHistoryById(userId);
        res.status(200)
            .json(history)
    });
    getMyCurrentsGroups = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        this.getGroupsByUser(req.user._id, res, next);
    };
    getCurrentGroups = (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {userId} = matchedData(req);
        this.getGroupsByUser(userId, res, next);
    };

    getGroupWinnersTop = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {quantity, groupId} = req.params;
        console.log(req.params)
        let result = await this.models.PurchaseHistory
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
            .exec();

        res.status(200)
            .json(result);
    });

    getTopWinners = catchAsync(async (req: Express.Request, res: Express.Response, next: NextFunction) => {
        const {quantity, groupId, times} = matchedData(req, {locations: ['query', 'params']});
        let sortOrder:any = {};
        let match: any = {action: "win"};
        if ( !!groupId )
            match.groupId = new ObjectId(groupId);
        if ( !!times )
            sortOrder.wonTimes = -1;
        else
            sortOrder.totalWon = -1;
        console.log('starting the query', sortOrder, match)
        let result = await this.models.PurchaseHistory.aggregate([
            {$match: {...match}},
            {$lookup: {from:'users' , localField: 'userId', foreignField: '_id', as: 'userInfo'}},
            {$unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true}},
            {$lookup: {
                    from: 'groupgames',
                    localField: 'groupId',
                    foreignField: '_id',
                    as: 'groupInfo'
                }},
            {$unwind: { path: "$groupInfo", preserveNullAndEmptyArrays: true}},
            {$project: {"groupInfo.members": 0 }},
            {
                $group:
                    {
                        _id: "$userInfo._id",
                        totalWon: { $sum:  "$quantity" },
                        userName: { $first: "$userInfo.userName" },
                        image: { $first: "$userInfo.image"},
                        lastWonDate: {$last: "$createdAt"},
                        wonTimes: { $sum: 1 }
                    }
            },
            {$sort: {...sortOrder}},
            {$limit: +quantity},
        ])
        .exec();

        res.status(200)
                .json(result);
    });

    private getGroupsByUser= async (userId: string | ObjectID, res: Express.Response, next: NextFunction) => {
        console.log('Searching by userID: ' + userId);
        const groups = await this.models.GroupGame.find({'members.userId': new ObjectID(userId)})
                res.status(200)
                    .json(groups);
    }
}
