'use strict';

module.exports = ( Schema, model) => {

    const memberSchema = new Schema({
       userId: {
           type: Schema.Types.ObjectId,
           ref: 'User'
       },
        userName: {
           type: Schema.Types.String,
           required: true
        }
    },{
        timestamps: true
    });
    const groupSchema = new Schema({
        initialInvertion: {
            type: Schema.Types.Number,
            required: true,
            unique: true
        },
        members: [memberSchema],
        enabled: {
            type: Boolean,
            required: true,
            default: true
        }
    },{
        timestamps: true
    });

    groupSchema.methods.addMember = async (memberData) => {
        const maxGroupSize = process.env.MAX_MEMBERS_PER_GROUP || 6;

        const session = await app.db.core.mongoose.startSession();
        try {
            session.startTransaction();
            const membersSize = this.members.length;
            if ( membersSize >= maxGroupSize ) {
                const winner = this.members.shift();
                console.log('Hay un ganador', winner);
            }
            const user = await app.db.core.models.User.find(userId);
            if ( !user )
                throw {status: 404, message: 'User not found!'};
            this.members.push({...memberData});
            await this.save();
            const userHistory = app.db.core.models.UserHistory({userId: memberData.userId, action: 'Are joined'});
            await userHistory.save();
            session.commitTransaction();
        } catch ( _err ) {
            session.abortTransaction();
            return Promise.reject(_err );
        }
    };

    return model('GroupGame', groupSchema);
};