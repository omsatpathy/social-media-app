const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    caption: String,
    image: {
        public_id: String,
        url: String
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: [true, 'Comment cannot be empty.'],
            trim: true
        }
    }]
    
}, {
    timestamps: true
})

const Post = mongoose.model('Post', postSchema)
module.exports = Post