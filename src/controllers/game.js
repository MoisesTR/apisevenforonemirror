const { matchedData, resultOrNotFound} = require('../utils/defaultImports');

module.exports  = app => {
    const methods = {};
    const models = app.db.core.models;

    methods.createGroup = ( req, res, next ) => {
        const groupData = matchedData(req, {locations: ['body']});

        const groupGame = new models.GroupGame({...groupData});
        groupGame.save()
            .then( group => res.json(201).json({message: 'Group created!!'}))
            .catch(next)
    };

    methods.getGameGroups = ( req, res, next ) => {

        models.GroupGame.
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
            ])
            .exec()
            .then(groups => res.status(200).json(groups))
            .catch(next)
    };

    methods.getGroupMembers = ( req, res, next ) => {
        const groupId = req.params.groupId;

        models.GroupGame
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

    methods.addMemberToGroup = ( req, res, next ) => {
        const relationData = matchedData(req);

        models.GroupGame.findById(relationData.groupId)
            .then( group => {
                if (!group)
                    throw ({ status: 404, message: 'Group not found!'});
                console.log(group)
                return group.addMember({userId: req.user._id, userName: req.user.userName}, relationData.payReference)
            })
            .then(result => res.status(201).json({message: 'Succesful member added!'}))
            .catch(next)
    };

    methods.removeMemberFromGroup = ( req, res, next ) => {
        const relationData = matchedData(req);

        models.GroupGame.findById(relationData.groupId)
            .then( group => {
                if (!group)
                    throw ({status: 404, message: 'Group not found!'});
                return group.removeMember(relationData.userId)
            })
            .then( group => res.status(200).json({message: 'Member was removed from group!'}) )
            .catch(next)
    };
    methods.getOwnPurchaseHistory = ( req, res, next ) => {
        req.user.getPurchaseHistory()
            .then( history => res.status(200).json(history))
            .catch(next)
    };

    methods.getPurchaseHistory = ( req, res, next ) => {
        const userId = req.params.userId;

        mode.User.find(userId)
            .then(user => {
                if (!user )
                    res.status(404).json({message: 'User not found!'});
                return user.getPurchaseHistory()
            })
            .then( history => res.status(200).json(history))
            .catch(next)
    };

    return methods;
};