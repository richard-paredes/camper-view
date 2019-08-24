const express = require('express'),
    router = express.Router({ mergeParams: true }),
    Campground = require('../models/campground'),
    Comment = require('../models/comment'),
    middleware = require('../middleware');

// CREATE
router.get('/new', middleware.isLoggedIn, (req, res) => {
    Campground.findOne({slug: req.params.slug}, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('/campgrounds');
        }
        res.render('comments/new', {
            campground: campground
        });
    });
});
router.post('/', middleware.isLoggedIn, (req, res) => {
    // look up campground
    Campground.findOne({slug: req.params.slug}, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            res.redirect('/campgrounds');
        }
        else {
            Comment.create(req.body.comment, (err, comment) => {
                if (err || !comment) {
                    req.flash('error', 'Failed to create comment.');
                    res.redirect(`/campgrounds/${req.params.slug}`)
                }
                else {
                    req.flash('success', 'Comment posted!');
                    // add associated username to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    // save comment with updated properties
                    comment.save();
                    // save comment onto campground
                    campground.comments.push(comment)
                    campground.save();
                    res.redirect(`/campgrounds/${campground.slug}`);
                }
            });
        }
    });
});

// UPDATE
router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res) => {
    Campground.findOne({slug: req.params.slug}, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('/campgrounds');
        }
        Comment.findById(req.params.comment_id, (err, comment) => {
            if (err || !comment) {
                req.flash('error', 'Comment does not exist.');
                res.redirect(`/campgrounds/${req.params.slug}`);
            }
            else {
                res.render('comments/edit', {
                    campground_slug: req.params.slug,
                    comment: comment
                });
            }
        });
    });

});
router.put('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    Campground.findOne({slug: req.params.slug}, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('/campgrounds');
        }
        Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, comment) => {
            if (err || !comment) {
                req.flash('error', 'Failed to update comment');
                res.redirect('/campgrounds');
            }
            else {
                req.flash('success', 'Successfully updated comment!');
                res.redirect(`/campgrounds/${req.params.slug}`);
            }
        });
    });

});

// DESTROY
router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    Campground.findOne({slug: req.params.slug}, (err, campground) => {
        if (err || !campground) {
            req.flash('Campground does not exist.');
            return res.redirect('back')
        }
        Comment.findByIdAndRemove(req.params.comment_id, (err, comment) => {
            if (err || !comment) {
                req.flash('error', 'Comment does not exist.');
                res.redirect('back');
            }
            else {
                req.flash('success', 'Successfully deleted comment!');
                res.redirect(`/campgrounds/${req.params.slug}`);
            }
        })
    });
});


module.exports = router;
