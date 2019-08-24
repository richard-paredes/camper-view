const express = require('express'),
    router = express.Router({ mergeParams: true }),
    async = require('async'),
    nodemailer = require('nodemailer'),
    crypto = require('crypto'),
    middleware = require('../middleware'),
    User = require('../models/user'),
    Notification = require('../models/notification'),
    Campground = require('../models/campground');

// forgot password
router.get('/forgot', (req, res) => {
    res.render('./users/forgot');
});
router.post('/forgot', (req, res, next) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, (err, buf) => {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, (err, user) => {
                if (err || !user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/users/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000 // 1 hr expiration

                user.save((err) => {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_PW
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'gamerview.info@gmail.com',
                subject: 'CamperView Password Reset',
                text: 'You are receiving this because you (or someone else) have requested ' +
                    'a password reset for your account. Please click on the following link, ' +
                    'or paste this into your browser to complete the process: \n\n' +
                    'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will ' +
                    ' remain unchanged.'
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions');
                done(err, 'done');
            });
        }
    ], (err) => {
        if (err) return next(err);
        res.redirect('/users/forgot');
    });
});

// PASSWORD RESET
router.get('/reset/:token', (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
        (err, user) => {
            if (err || !user) {
                req.flash('error', 'Password reset token is invalid or has expired.');
                return res.redirect('/users/forgot');
            }
            res.render('./users/reset', { token: req.params.token });
        });
});
router.post('/reset/:token', function(req, res) {
    async.waterfall([
        (done) => {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
                if (err || !user) {
                    req.flash('error', 'Password reset token is invalid or has expired');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, (err) => {
                        if (err || !user) {
                            req.flash('error', err.message);
                            return res.redirect('back');
                        }
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save((err) => {
                            if (err || !user) {
                                req.flash('error', err.message);
                                return res.redirect('back');
                            }
                            req.logIn(user, (err) => {
                                done(err, user);
                            });
                        });
                    });
                }
                else {
                    req.flash('error', 'Passwords do not match.');
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            const smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'gamerview.info@gmail.com',
                    pass: process.env.GMAIL_PW
                }
            });
            const mailOptions = {
                to: user.email,
                from: 'gamerview.info@gmail.com',
                subject: 'Your password has been changed!',
                text: `Hello, ${user.firstName},\n\n` +
                    `This is a confirmation that the password for your account ${user.email} has just been changed.`
            };
            smtpTransport.sendMail(mailOptions, (err) => {
                req.flash('success', 'Your password has been successfully changed!');
                done(err);
            });
        }
    ], (err) => {
        if (err) {
            req.flash('error', 'Something went wrong.');
        }
        res.redirect('/campgrounds');
    });
});

// USER PROFILE
router.get('/:id', (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err || !user) {
            req.flash('error', 'User not found.');
            return res.redirect('/campgrounds');
        }
        Campground.find().where('author.id').equals(user._id).exec((err, campgrounds) => {
            if (err || !campgrounds) {
                req.flash('error', 'Something went wrong.');
                return res.redirect('back');
            }
            res.render('./users/show', { userProfile: user, campgrounds: campgrounds });
        });
    });
});

// DELETE USER
router.delete('/:id', middleware.checkUserProfileOwnership, async(req, res) => {
    try {
        let user = await User.findById(req.params.id);
        user.remove() // trigger pre-hook
        let campgrounds = await Campground.find().where('author.id').equals(user._id).exec();
        campgrounds.remove(); // to trigger pre-hook
        await Notification.deleteMany({ campgroundId: { $in: campgrounds } });
        req.flash('success', 'Account successfully deleted.');
        res.redirect('/campgrounds');

    }
    catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

// follow user
router.get('/:id/follow', middleware.isLoggedIn, async(req, res) => {
    try {

        let user = await User.findByIdAndUpdate(req.params.id, {
            $addToSet: {
                followers: {
                    $each: [req.user._id]
                }
            }
        }, { new: true });

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: {
                following: {
                    $each: [req.params.id]
                }
            }
        }, { new: true });

        req.flash('success', 'Successfully following ' + user.username + '!');
        res.redirect(`/users/${req.params.id}`);

    }
    catch (err) {
        req.flash('error', err.message);
        res.redirect('back');
    }
});

module.exports = router;
