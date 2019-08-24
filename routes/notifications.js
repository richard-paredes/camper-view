const express           = require('express'),
    router              = express.Router({ mergeParams: true }),
    middleware          = require('../middleware/index'),
    User                = require('../models/user'),
    Notification        = require('../models/notification');
    

router.get('/', middleware.isLoggedIn, async (req, res) => {
    try {
        let user = await User.findById(req.user._id).populate({
            path: 'notifications',
            options: {sort: {"_id": -1} }
        }).exec();
        let allNotifications = user.notifications;
        res.render('./notifications/index', {allNotifications: allNotifications});
    } catch(err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

router.get('/:id', middleware.isLoggedIn, async (req, res) => {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect(`/campgrounds/${notification.campgroundSlug}`);
    } catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

router.delete('/', middleware.isLoggedIn, async (req, res) => {
    try {
        let user = await User.findByIdAndUpdate(req.user._id, { $set: { notifications: [ ] }});
        let notifications = user.notifications;
        await Notification.deleteMany({
            _id: {
                $in: notifications
            }
        });
        res.redirect('back');
    } catch(err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

module.exports = router;