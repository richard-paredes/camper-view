const express       = require('express'),
    router          = express.Router({mergeParams: true}),
    Campground      = require('../models/campground'),
    Review          = require('../models/review'),
    middleware      = require('../middleware');
    

// INDEX
router.get('/', (req, res)=>{
    Campground.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        options: {sort: {createdAt: -1}}
    }).exec((err, campground)=> {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('back');
        }
        res.render('reviews/index', {campground: campground});
    });
});

// NEW
router.get('/new', middleware.isLoggedIn, middleware.checkReviewExistence, (req, res)=> {
    Campground.findOne({slug: req.params.slug}, (err, campground)=> {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('back');
        }
        res.render('reviews/new', {campground: campground});
    });
});
router.post('/', middleware.isLoggedIn, middleware.checkReviewExistence, (req, res) => {
    Campground.findOne({slug: req.params.slug}).populate('reviews').exec((err, campground)=> {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('back');
        }
        Review.create(req.body.review, (err, review)=> {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.campground = campground;
            review.save();
            campground.reviews.push(review);
            campground.rating = calculateAverage(campground.reviews);
            campground.save();
            req.flash('success', 'Your review has been successfully added!');
            res.redirect(`/campgrounds/${campground.slug}`);
        });
    });
});

// EDIT
router.get('/:review_id/edit', middleware.checkReviewOwnership, (req, res)=> {
    Review.findById(req.params.review_id, (err, review)=> {
        if (err || !review) {
            req.flash('error', 'Review does not exist.');
            return res.redirect('back');
        }
        res.render('reviews/edit', {campground_slug: req.params.slug, review: review});
    });
});
router.put('/:review_id', middleware.checkReviewOwnership, (req, res)=> {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, (err, review)=> {
        if (err || !review) {
            req.flash('error', 'Review does not exist.');
            return res.redirect('back');
        }
        Campground.findOne({slug: req.params.slug}).populate('reviews').exec((err, campground)=> {
            if (err || !campground) {
                req.flash('error', 'Campground does not exist.');
                return res.redirect('back');
            }
            console.log(campground.reviews);
            campground.rating = calculateAverage(campground.reviews);
            campground.save();
            req.flash('success', 'Successfully updated review!');
            res.redirect(`/campgrounds/${campground.slug}`);
        });
    });
});

// DELETE
router.delete('/:review_id', middleware.checkReviewOwnership, (req, res)=> {
    Review.findByIdAndRemove(req.params.review_id, (err)=> {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        Campground.findOneAndUpdate({slug: req.params.slug}, 
        {$pull: {reviews: req.params.review_id}}, {new: true}).populate('reviews').exec((err, campground)=> {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            campground.rating = calculateAverage(campground.reviews);
            campground.save();
            req.flash('success', 'Successfully deleted review.');
            res.redirect(`/campgrounds/${campground.slug}`);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function(review) {
        sum += review.rating;
    });
    return (sum/reviews.length);
}

module.exports = router;