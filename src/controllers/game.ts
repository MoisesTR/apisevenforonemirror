import Express, {NextFunction} from 'express';
import {matchedData, resultOrNotFound} from '../utils/defaultImports';
import Server from "../server";
import {IModels} from "../db/core";
import {IGroupGameDocument} from "../db/interfaces/IGroupGame";
import {Types} from "mongoose";
import {ObjectID} from "bson";
import {IPurchaseHistoryDocument} from "../db/interfaces/PurchaseHistory";
import DocumentArray = Types.DocumentArray;

export default class GameController {
    private models: IModels;

    constructor(server: Server) {
        this.models = server.dbCore.models;
    }
    createGroup = ( req: Express.Request, res: Express.Response, next: (err: any) => void ) => {
        const groupData = matchedData(req, {locations: ['body']});

        const groupGame = new this.models.GroupGame({...groupData});
        groupGame.save()
            .then( group => res.json(201).json({message: 'Group created!!'}))
            .catch(next)
    };

    getGameGroups = ( req: Express.Request, res: Express.Response, next: NextFunction ) => {

        this.models.GroupGame.
            aggregate([
            {
                $project: {
                    initialInvertion: 1,
                    enabled: 1,
                    winners: 1,
                    totalInvested: 1,
                    totalMembers: {$cond: {if: {$isArray: "$members"}, then: {$size: "$members"}, else: "NA"}}
                }
            }
            ]).sort( { initialInvertion: 1 } )
            .exec()
            .then((groups: Types.DocumentArray<IGroupGameDocument>) => res.status(200).json(groups))
            .catch(next)
    };

    getGroupMembers = ( req: Express.Request, res: Express.Response, next: (err?: any) => void ) => {
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
            .catch(next)
    };

    addMemberToGroup = ( req: Express.Request, res: Express.Response, next: NextFunction ) => {
        const relationData = matchedData(req);

        this.models.GroupGame.findById(relationData.groupId)
            .then( group => {
                if (!group)
                    throw ({ status: 404, message: 'Group not found!'});
                console.log(group)
                return group.addMember({
                    userId: req.user._id
                    , userName: req.user.userName
                    , image: req.user.image
                } , relationData.payReference)
            })
            .then(result => res.status(201).json({message: 'Succesful member added!'}))
            .catch(next)
    };

    removeMemberFromGroup = ( req: Express.Request, res: Express.Response, next: (err: any) => void) => {
        const relationData = matchedData(req);

        this.models.GroupGame.findById(relationData.groupId)
            .then( group => {
                if (!group)
                    throw ({status: 404, message: 'Group not found!'});
                return group.removeMember(relationData.userId)
            })
            .then( group => res.status(200).json({message: 'Member was removed from group!'}) )
            .catch(next)
    };
    getOwnPurchaseHistory = ( req: Express.Request, res: Express.Response, next: NextFunction ) => {
        console.log(req.user);
        req.user.getPurchaseHistory()
            .then( (history: DocumentArray<IPurchaseHistoryDocument>) => res.status(200).json(history))
            .catch(next)
    };

    getPurchaseHistory = ( req: Express.Request, res: Express.Response, next: (err: any) => void ) => {
        const userId = req.params.userId;
        this.models.User.findById(userId)
            .then(user => {

                if ( !user )
                    throw {status:404, message: 'User not found!'};

                return user.getPurchaseHistoryById(userId)
            })
            .then( history => res.status(200).json(history))
            .catch(next)
    };
    getMyCurrentsGroups = ( req: Express.Request, res: Express.Response, next: NextFunction ) => {
       this.getGroupsByUser( req.user._id, res, next);
    };
    getCurrentGroups = ( req: Express.Request, res: Express.Response, next: NextFunction ) => {
        const {userId} = matchedData(req);
        this.getGroupsByUser( userId, res, next);
    };


    private getGroupsByUser( userId: string | ObjectID, res: Express.Response, next: NextFunction) {
        console.log('Searching by userID: ' + userId)
        this.models.GroupGame.find({ "members.userId": new ObjectID(userId)})
            .then( groups => {
                res.status(200)
                    .json(groups)
            })
            .catch(next)
    }

}
