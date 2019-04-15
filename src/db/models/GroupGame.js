'use strict';
const bson = require('bson');

module.exports = ( Schema, model, mongoose) => {

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
            unique: true,
            index: true
        },
        members: [memberSchema],
        winners: {
            type: Schema.Types.Number,
            required: true,
            default: 0
        },
        totalInvested: {
            type: Schema.Types.Number,
            required: true,
            default: 0
        },
        enabled: {
            type: Boolean,
            required: true,
            default: true
        }
    },{
        timestamps: true
    });

    groupSchema.methods.removeMember = async function( memberId ) {
        console.log(this.members)
        console.log(mongoose.Types.ObjectId(memberId))
        this.members.forEach(member => {
            console.log(mongoose.Types.ObjectId(member.userId)
                            .equals( mongoose.Types.ObjectId(memberId)))
        })
        const removeMember = this.members.find(member => member.userId.equals(mongoose.Types.ObjectId(memberId)));
        if (!removeMember )
            throw  { status: 404, message: 'This user is not a member of this group!'};
        removeMember.remove();

        return this.save();
    };

    groupSchema.methods.addMember = async function(memberData, payReference) {
        const maxGroupSize = process.env.MAX_MEMBERS_PER_GROUP || 6;

        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            const membersSize = this.members.length;
            // const alreadyIndex = this.members.find( member => member.userId.equals( memberData.userId))
            // if ( alreadyIndex )
            //     throw {status: 409, message: 'This user is already member!'}
            if ( membersSize >= maxGroupSize ) {
                const winner = this.members.shift();
                /**
                 * TODO: Create pay prize reference
                 */
                const userHistory = this.model('PurchaseHistory')({userId: winner.userId, action: 'win',  groupId:this._id ,quantity:this.initialInvertion *6, payReference: 'pay prize reference'});
                this.winners++;
                await userHistory.save();
            }
            const user = await this.model('User').findById(memberData.userId);
            if ( !user )
                throw {status: 404, message: 'User not found!'};

            this.members.push({...memberData});

            this.totalInvested += this.initialInvertion;
            await this.save();
            const userHistory = this.model('PurchaseHistory')({userId: memberData.userId, action: 'invest',  groupId:this._id ,quantity: this.initialInvertion,payReference: payReference});
            await userHistory.save();
            session.commitTransaction();
        } catch ( _err ) {
            session.abortTransaction();
            return Promise.reject(_err );
        }
    };

    return model('GroupGame', groupSchema);
};