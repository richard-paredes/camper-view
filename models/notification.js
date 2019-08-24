const mongoose = require('mongoose');

const NotificationSchema = mongoose.Schema({
    username: String,
    campgroundSlug: String,
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Notification', NotificationSchema);