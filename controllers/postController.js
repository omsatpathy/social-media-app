const asyncHandler = require('express-async-handler')
const User = require('../models/User')
const Post = require('../models/Post')

/*
    @desc CREATE POST
    @route POST api/posts/create
    @access private
*/
const createPost = asyncHandler(async(req, res) => {
    //create a new post
    const postData = {
        owner: req.user._id,
        caption: req.body.caption,
        image: {
            public_id: 'image-publicId',
            url: 'image-url'
        }
    }
    const newPost = await Post.create(postData);

    //find user who created the post and push post id in user.posts array so that posts can be accessed in future
    const user = await User.findById(req.user._id)
    user.posts.push(newPost._id)
    await user.save();

    //if post is succesfully created then respond 
    if(newPost) {
        res.status(200).json({
            owner: newPost.owner,
            caption: newPost.caption,
            image: newPost.image,
            likes: newPost.likes,
            comments: newPost.comments
        })
    } else {
        res.status(400)
        throw new Error('Post not created.')
    }
})

/*
    @desc UPDATE POST
    @route PATCH api/posts/update
    @access private
*/
const updatePost = asyncHandler(async(req, res) => {
    const { caption } = req.body
    const postId = req.params.postId;

    const post = await Post.findById(postId)
    const postUserId = post.owner.toString()
    const loggedInUserId = req.user._id.toString()

    if(postUserId === loggedInUserId) {
        post.caption = caption
        await post.save()

        res.status(200).json({
            owner: post.owner,
            caption: post.caption,
            image: post.image,
            likes: post.likes,
            comments: post.comments
        })
    } else {
        res.status(400)
        throw new Error('User not authorized.')
    }
})

/*
    @desc GET MY POSTS
    @route GET api/posts/my-posts
    @access private
*/
const getMyPosts = asyncHandler(async(req, res) => {
    const posts = await Post.find({ owner: req.user._id })

    if(posts) {
        res.status(200).json(posts)
    } else {
        res.status(404)
        throw new Error('No posts found.')
    }
})

/*
    @desc GET POSTS OF FOLLOWING
    @route PATCH api/posts/get-posts
    @access private
*/
const getPostsOfFollowing = asyncHandler(async(req, res) => {
    //get all posts whose owner matches one IDs of following array of user
    const posts = await Post.find({ owner: { $in: req.user.following } })

    //if posts are found respond
    if(posts.length > 0) {
        res.status(200).json({
            posts
        })
    } else {
        res.status(404)
        throw new Error('No posts found')
    } 
})

/*
    @desc LIKE/UNLIKE POST
    @route PATCH api/posts/like-unlike/:postId
    @access private
*/
const likeUnlikePost = asyncHandler(async(req, res) => {
    const post = await Post.findById(req.params.postId)

    if(!post) {
        res.status(404)
        throw new Error('Post not found.')
    }
    //if post is liked dislike it, else like it
    if(post.likes.includes(req.user._id)) {
        const index = post.likes.indexOf(req.user._id)
        post.likes.splice(index, 1)
        await post.save()

        res.status(200).json({
            message: 'Post unliked.'
        })
    } else {
        post.likes.push(req.user._id)
        await post.save()

        res.status(200).json({
            message: 'Post liked.'
        })
    }
})

/*
    @desc ADD COMMENT 
    @route POST api/posts/comment/:postId
    @access private
*/
const addComment = asyncHandler(async(req, res) => {
    const post = await Post.findById(req.params.postId)
    //check whethere post is there or not
    if(!post) {
        res.status(404)
        throw new Error('Post does not exist.')
    }
    //if post is found, add comment
    post.comments.push({user: req.user._id, text: req.body.text})
    await post.save()
    
    res.status(200).json({
        message: 'Comment created.'
    })
    
})

/*
    @desc UPDATE COMMENT 
    @route PATCH api/posts/comment/:postId/:commentId
    @access private
*/
const updateComment = asyncHandler(async(req, res) => {
    const post = await Post.findById(req.params.postId)
    const commentId = req.params.commentId

    if(!post) {
        res.status(404)
        throw new Error('Post not found.')
    }
    //find the index of the comment with commentId in comments[] array of post with postId
    let commentIndex = -1
    const comment = post.comments.find((item,index) => {
        if(item._id.toString() === commentId.toString()) {
            commentIndex = index
            return true
        }
    })
    //if comment is found AND current loggedIn user is same as comment user id(i.e. user who added the comment), update it
    if(comment && comment.user.toString() === req.user._id.toString()) {
        post.comments[commentIndex].text = req.body.text

        //this is also a valid way of doing above task, but above snippet is more understandable and general
        // comment.text = req.body.text

        await post.save()
        res.status(200).json({
            message: 'Comment updated.'
        })
    } else {
        res.status(400)
        throw new Error('Comment not found or unauthroized user.')
    }
})

/*
    @desc DELETE COMMENT 
    @route DELETE api/posts/comment/:postId/:commentId
    @access private
*/
const deleteComment = asyncHandler(async(req, res) => {
    const post = await Post.findById(req.params.postId)
    const commentId = req.params.commentId

    if(!post) {
        res.status(404)
        throw new Error('Post not found.')
    }
    //find the index of the comment which user want to delete
    let commentIndex = -1
    const comment = post.comments.find((item, index) => {
        if(item._id.toString() === commentId.toString()) {
            commentIndex = index 
            return true
        }
    })
    //check if comment with gievn id exitss and user is the creator of comment
    if(comment && comment.user.toString() === req.user._id.toString()) { 
        //delete the comment and save
        post.comments.splice(commentIndex, 1)
        await post.save()

        //respond
        res.status(200).json({
            message: 'Comment deleted.'
        })
    } else {
        res.status(400)
        throw new Error('Comment not found or unauthorized user.')
    }

})

/*
    @desc DELETE POST 
    @route DELETE api/posts/:postId
    @access private
*/
const deletePost = asyncHandler(async(req, res) => {
    const userId = req.user._id
    const postId = req.params.postId
    const post = await Post.findOne({owner: userId, _id: postId})
    
    if(!post) {
        res.status(400)
        throw new Error('Post not found or unauthorized user.')
    }

    //delete the post from post collections
    const deletedPost = await Post.findByIdAndDelete(postId)

    //remove post from user's post[] array, if post is deleted. Else, give error message
    if(deletedPost) {
        const user = await User.findById(userId)
        const index = user.posts.indexOf(postId)
        user.posts.splice(index, 1)
        await user.save()
    } else {
        res.status(400)
        throw new Error('Internal server error.')
    }

    //final response 
    res.status(200).json({
        message: 'Post deleted.'
    })

})


module.exports = {
    createPost,
    updatePost,
    getMyPosts,
    getPostsOfFollowing,
    likeUnlikePost,
    addComment,
    updateComment,
    deletePost,
    deleteComment
}