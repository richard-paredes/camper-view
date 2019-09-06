const express       = require('express'),
    router          = express.Router({ mergeParams: true }),
    passport        = require('passport'),
    User            = require('../models/user');

// root route
router.get('/', (req, res) => {
    res.render('landing');
});

// show login form
router.get('/login', (req, res) => {
    res.render('login', { referer: req.headers.referer, page: 'login' });
});
router.post("/login", passport.authenticate("local", { failureRedirect: "/login", failureFlash: 'Invalid username or password.' }),
    (req, res) => {
        req.flash('success', `Welcome back, ${req.user.username}`);
        if (req.body.referer && (req.body.referer !== undefined && req.body.referer.slice(-6) !== "/login")) {
            res.redirect(req.body.referer);
        }
        else {
            res.redirect("/campgrounds");
        }
    });

// logout route
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'You have been logged out');
    res.redirect('back');
});


// show registration form
router.get('/register', (req, res) => {
    res.render('register', { page: 'register' });
});
router.post('/register', (req, res) => {
    const newUser = new User({
        firstName: req.body.firstname,
        lastName: req.body.lastname,
        email: req.body.email,
        username: req.body.username,
        avatar: (req.body.avatar === '') ? undefined : req.body.avatar,
        isAdmin: (req.body.adminCode === 'secretcode123') ? true : false
    });
    if (req.body.adminCode === 'secretcode123') {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) => {
        if (err || !user) {
            return res.render('register', { 'error': err.message });
        }
        passport.authenticate('local')(req, res, () => {
            req.flash('success', `Successfully Signed Up!\nWelcome to CamperView, ${req.body.username}`);
            res.redirect('/campgrounds');
        });
    });
});

module.exports = router;
