const mongoose      = require('mongoose'),
    Comment         = require('./comment'),
    Review          = require('./review'),
    cloudinary      = require('cloudinary');
    
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
    
// SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
    name: { 
        type: String,
        unique: true
    },
    price: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: { type: Date, default: Date.now },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1484960055659-a39d25adcb3c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=900&q=60'
    },
    imageId: String,
    description: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    slug: {
        type: String,
        unique: true
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    rating: {
        type: Number,
        default: 0
    }
});

campgroundSchema.pre('save', async function(next) {
    try {
        // check if new campground being saved or name being modified
        if (this.isNew || this.isModified('name')) {
            this.slug = await generateUniqueSlug(this._id, this.name);
        }
        next();
    } catch(err) {
        next(err);
    }
});

// PRE-HOOK TO REMOVE COMMENTS, IMAGE, REVIEWS IF CAMPGROUND POST DELETED
campgroundSchema.pre('remove', async function(next) {
    try {
        cloudinary.v2.uploader.destroy(this.imageId, (err, res)=> {
            if (err) console.log('failed to delete image in cloudinary:', err);
        });
        await Comment.deleteMany({
            _id: {
                $in: this.comments
            }
        });
        await Review.deleteMany({
            _id: {
                $in: this.reviews
            }
        });
        
        next();
    }
    catch (err) {
        next(err);
    }
});

const Campground = mongoose.model('Campground', campgroundSchema);

async function generateUniqueSlug(id, campgroundName, slug) {
    try {
        // initial slug
        if (!slug) {
            slug = slugify(campgroundName);
        }
        // check if a campground with slug already exists
        var campground = await Campground.findOne({slug: slug});
        // check if a campground was found or if found campground is current campground
        if (!campground || campground._id.equals(id)) {
            return slug;
        }
        // if not unique, generate new slug
        var newSlug = slugify(campgroundName);
        // checkagain by calling function recursively
        return await generateUniqueSlug(id, campgroundName, newSlug);
    } catch (err) {
        throw new Error(err);
    }
}

function slugify(text) {
    var slug = text.toString().toLowerCase()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '-')      // Replace multiple - with single -
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '')          // Trim - from end of text
        .substring(0, 75);           // Trim at 75 characters
    
    return slug + '-' + Math.floor(1000 + Math.random() * 9000); // Add 4 random digits to improve uniqueness
}

// MODEL SETUP
module.exports = Campground;
