const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    text: String,
    createdAt: { type: Date, default: Date.now },
    // we only take important pieces of author
    // and store that in here, not the entire User entity
        // inefficient to embed because needs a lot of queries
        // can only do with non-relational DB
    author: {
        id:  {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model('Comment', commentSchema);