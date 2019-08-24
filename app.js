// PACKAGES / LIBRARIES
require('dotenv').config();
const express = require('express'),
    app = express(),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    flash = require('connect-flash'),
    passport = require('passport'),
    LocalStrategy = require('passport-local'),
    expressSession = require('express-session'),
    methodOverride = require('method-override');
app.locals.moment = require('moment');
// MODELS
const User = require('./models/user');
// ROUTES
const commentRoutes = require('./routes/comments'),
    campgroundRoutes = require('./routes/campgrounds'),
    userRoutes = require('./routes/users'),
    notificationRoutes = require('./routes/notifications'),
    indexRoutes = require('./routes/index'),
    reviewRoutes = require('./routes/reviews');

const atlasURI = process.env.DATABASEURL || `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PW2}@cluster0-udspt.mongodb.net/test?retryWrites=true&w=majority`;
mongoose.connect(atlasURI, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(console.log('Connected to MONGODB')).catch((err) => { console.log(`ERROR: ${err.message}`) });

// APP CONFIGUARTION
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(methodOverride("_method"));
app.use(flash());

// PASSPORT (USER-AUTH) CONFIGURATION
app.use(expressSession({
    secret: 'Some random string that is intense for decoding',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// POPULATE NOTIFICATIONS FROM FOLLOWED USERS
app.use(async(req, res, next) => {
    res.locals.user = req.user;
    if (req.user) {
        try {
            let user = await User.findById(req.user._id).populate('notifications', null, { isRead: false }).exec();
            res.locals.notifications = user.notifications.reverse();
        }
        catch (err) {
            console.log(err.message);
        }
    }
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

// ROUTES USED
app.use('/', indexRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/users', userRoutes);
app.use('/campgrounds/:slug/comments', commentRoutes);
app.use('/notifications', notificationRoutes);
app.use('/campgrounds/:slug/reviews', reviewRoutes);

app.listen(process.env.PORT, process.env.IP, () => {
    console.log(`Server initiated on port ${process.env.PORT}`);
});
