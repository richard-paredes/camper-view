const mongoose              = require('mongoose'),
     Notification           = require('./notification'),
     Campground             = require('./campground'),
      passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: String,
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, required: true },
    avatar: { type: String, default: 'https://where-inc.com/wpradmin/template/enfold/images/no_agent.png' },
    notifications: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Notification'
        }
    ],
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }  
    ],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: { type: Boolean, default: false }
});

// PRE-HOOK TO REMOVE NOTIFICATIONS IF USER DELETED
UserSchema.pre('remove', async function(next) {
    try {
        await Notification.deleteMany({
            _id: {
                $in: this.notifications
            }
        });
        await Campground.deleteMany({
            author: {
                id: this._id
            }
        });
        next();
    }
    catch (err) {
        next(err);
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);
