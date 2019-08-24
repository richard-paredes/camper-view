const Campground        = require('../models/campground'),
    Comment             = require('../models/comment'),
    User                = require('../models/user'),
    Review              = require('../models/review');
var middlewareObject = {};

// middleware
middlewareObject.isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You must be logged in to do that.');
    res.redirect('/login');
};

middlewareObject.checkCampgroundOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findOne({slug: req.params.slug}, (err, campground) => {
            if (err || !campground) {
                req.flash('error', 'Campground does not exist.');
                res.redirect('/campgrounds');
            }
            else {
                if (campground.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                }
                else {
                    req.flash('error', 'You do not have permission to do that.');
                    res.redirect('back');
                }
            }
        });

    }
    else {
        req.flash('error', 'You must be logged in to do that.');
        res.redirect('back');
    }
};

middlewareObject.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, (err, comment) => {
            if (err || !comment) {
                req.flash('error', 'Comment does not exist.');
                res.redirect('/campgrounds');
            }
            else {
                if (comment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                }
                else {
                    res.redirect('back');
                }
            }
        });

    }
    else {
        req.flash('error', 'You must be logged in to do that.');
        res.redirect('back');
    }
};

middlewareObject.checkUserProfileOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        User.findById(req.params.id, (err, userProfile) => {
            if (err || !userProfile) {
                req.flash('error', 'User does not exist.');
                res.redirect('/campgrounds');
            } else {
                if (userProfile._id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', 'You must be logged in to do that.');
        res.redirect('back');
    }
};

middlewareObject.checkReviewOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Review.findById(req.params.review_id, (err, review)=> {
            if (err || !review) {
                res.redirect('back');
            } else {
                if (review.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash('error', "You don't have permission  to do that!");
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', 'You must be logged in to do that.');
        res.redirect('back');
    }
};

middlewareObject.checkReviewExistence = function(req, res, next) {
    if (req.isAuthenticated()) {
        Campground.findOne({slug: req.params.slug}).populate('reviews').exec((err, campground)=> {
            if (err || !campground) {
                req.flash('error', 'Campground does not exist.');
                res.redirect('back');
            } else {
                // check if user already wrote a review
                var userReview = campground.reviews.some((review)=> {
                    return review.author.id.equals(req.user._id);
                });
                if (userReview) {
                    req.flash('error', 'You already wrote a review.');
                    return res.redirect(`/campgrounds/${campground.slug}`);
                }
                next();
            }
        });
    } else {
        req.flash('error', 'You must be logged in to do that.');
        res.redirect('back');
    }
};


module.exports = middlewareObject;