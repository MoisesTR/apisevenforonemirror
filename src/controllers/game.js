const {matchedData} = require('express-validator/filter');

module.exports  = app => {
    const methods = {};
    const models = app.db.core.models;

    methods.createGroup = ( req, res, next ) => {
        const groupData = matchedData(req, {locations: ['body']});

        const groupGame = new models.GroupGame({...groupData});
        groupGame.save()
            .then( group => res.json(201).json(group))
            .catch(next)
    };

    methods.getGameGroups = ( req, res, next ) => {

        models.GroupGame.find()
            .then(groups => res.status(200).json(groups))
            .catch(next)
    };

    methods.addMemberToGroup = ( req, res, next ) => {
        const relationData = matchedData(req);

        models.GroupGame.findOne(relationData.groupId)
            .then( group => {
                if (!group)
                    throw ({ status: 404, message: 'Group not found!'});
                return group.addMember({userId: relationData.userId, userName: relationData.userName})
            })
            .catch(next)
    };

    methods.removeMemberFromGroup = ( req, res, next ) => {
        const relationData = matchedData(req);

        models.GroupGame.findOne(relationData.groupId)
            .then( group => {
                if (!group)
                    throw ({status: 404, message: 'Group not found!'});
                return group.members.id(relationData.memberId).remove()
            })
            .then( deletedGroup => res.status(200).json({message: 'Member was removed from group!'}) )
            .catch(next)
    };

    return methods;
};