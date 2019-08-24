const express = require('express'),
    router = express.Router(),
    Campground = require('../models/campground'),
    Notification = require('../models/notification'),
    User = require('../models/user'),
    Review = require('../models/review'),
    middleware = require('../middleware'),
    NodeGeocoder = require('node-geocoder'),
    multer = require('multer'),
    storage = multer.diskStorage({
        filename: function(req, file, callback) {
            callback(null, Date.now() + file.originalname);
        }
    });

const geocoder = NodeGeocoder({
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
});

const imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// INDEX CAMPGROUND ROUTE
router.get('/', (req, res) => {
    let perPage = 6,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1;

    // fuzzy search
    if (req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({
            $or: [
                { name: regex }, { location: regex }, { "author.username": regex }
            ]
        }).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            Campground.countDocuments({
                $or: [
                    { name: regex }, { location: regex }, { "author.username": regex }
                ]
            }).exec(function(err, count) {
                if (err) {
                    console.log(err);
                    return res.redirect("back");
                }
                else {
                    if (allCampgrounds.length < 1) {
                        req.flash('error', 'No campgrounds match that search.');
                        return res.redirect('back');
                    }
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        page: 'campgrounds',
                        user: req.user,
                        search: req.query.search
                    });
                }
            });
        });
    }
    else {
        Campground.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err, allCampgrounds) {
            if (err) {
                return res.redirect('/campgrounds');
            }
            Campground.estimatedDocumentCount().exec(function(err, count) {
                if (err) {
                    req.flash('error', 'Failed to find campgrounds.');
                    res.redirect('/campgrounds');
                }
                else {
                    res.render("campgrounds/index", {
                        campgrounds: allCampgrounds,
                        current: pageNumber,
                        pages: Math.ceil(count / perPage),
                        // page: 'campgrounds',
                        user: req.user
                    });
                }
            });
        });
    }

});

// NEW CAMPGROUND ROUTE
router.get('/new', middleware.isLoggedIn, (req, res) => {
    res.render('./campgrounds/new');
});
router.post('/', middleware.isLoggedIn, upload.single('image'), async(req, res) => {

    try {
        let locationData = await geocoder.geocode(req.body.campground.location);
        let uploadedImage = await cloudinary.v2.uploader.upload(req.file.path);

        req.body.campground.image = uploadedImage.secure_url;
        req.body.campground.imageId = uploadedImage.public_id;
        req.body.campground.author = { id: req.user._id, username: req.user.username };
        req.body.campground.location = locationData[0].formattedAddress;
        req.body.campground.lat = locationData[0].latitude;
        req.body.campground.lng = locationData[0].longitude;

        let campground = await Campground.create(req.body.campground);
        let user = await User.findById(req.user._id).populate('followers').exec();
        let newNotification = { username: req.user.username, campgroundSlug: campground.slug };

        // inefficient process, should be done in a different background job node process (not sure how)
        for (const follower of user.followers) {
            let notification = await Notification.create(newNotification);
            follower.notifications.push(notification);
            follower.save();
        }

        req.flash('success', 'Campground posted!');
        res.redirect(`/campgrounds/${campground.slug}`);

    }
    catch (err) { // give more meaningful error messages :( 
        req.flash('error', err.message);
        res.redirect('back');
    }

});

// SHOW CAMPGROUND ROUTE
router.get('/:slug', (req, res) => {
    // populate comment array with actual comment data
    Campground.findOne({ slug: req.params.slug }).populate('comments likes').populate({
        path: 'reviews',
        options: { sort: { createdAt: -1 } }
    }).exec((err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            res.redirect('/campgrounds');
        }
        else {
            res.render('./campgrounds/show', { campground: campground });
        }
    });
});


// EDIT CAMPGROUND ROUTE
router.get('/:slug/edit', middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findOne({ slug: req.params.slug }, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            res.redirect('/campgrounds');
        }
        res.render('campgrounds/edit', { campground: campground });
    });
});
// UPDATE CAMPGROUND ROUTE
router.put('/:slug', middleware.checkCampgroundOwnership, upload.single('image'), (req, res) => {
    delete req.body.campground.rating; // prevent rating from being manipulated
    Campground.findOne({ slug: req.params.slug }, (err, campground) => {
        if (err) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('back');
        }
        geocoder.geocode(req.body.campground.location, async(err, data) => {
            if (err || !data.length) {
                req.flash('error', 'Invalid address');
                return res.redirect('back');
            }
            if (req.file) {
                try {
                    await cloudinary.v2.uploader.destroy(campground.imageId);
                    let result = await cloudinary.v2.uploader.upload(req.file.path);
                    campground.imageId = result.public_id;
                    campground.image = result.secure_url;
                }
                catch (err) {
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
            }
            campground.location = data[0].formattedAddress;
            campground.lat = data[0].latitude;
            campground.lng = data[0].longitude;

            campground.name = req.body.campground.name;
            campground.price = req.body.campground.price;
            campground.description = req.body.campground.description;

            campground.save();
            req.flash('success', 'Successfully updated campground!');
            res.redirect(`/campgrounds/${campground.slug}`);

        });
    });
});

router.post('/:slug/like', middleware.isLoggedIn, (req, res) => {
    Campground.findOne({ slug: req.params.slug }, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            return res.redirect('/campgrounds');
        }
        // check if req.user._id exists
        var foundUserLike = campground.likes.some(like => {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            campground.likes.pull(req.user._id);
        }
        else {
            campground.likes.push(req.user);
        }

        campground.save((err) => {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('/campgrounds');
            }
            return res.redirect(`/campgrounds/${campground.slug}`);
        });
    });
});


// DESTROY CAMPGROUND ROUTE
router.delete('/:slug', middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findOne({ slug: req.params.slug }, (err, campground) => {
        if (err || !campground) {
            req.flash('error', 'Campground does not exist.');
            res.redirect('/campgrounds');
        }
        else {
            campground.remove();
            req.flash('success', `Successfully deleted ${campground.name}!`);
            res.redirect('/campgrounds');
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;
