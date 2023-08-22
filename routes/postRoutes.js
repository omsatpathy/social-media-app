const express = require('express')
const {
    createPost,
    updatePost,
    getMyPosts,
    getPostsOfFollowing,
    likeUnlikePost,
    addComment,
    updateComment,
    deleteComment,
    deletePost
} = require('../controllers/postController')
const { protect } = require('../middlewares/authMiddleware')

const router = express.Router()

router.post('/create', protect, createPost)
router.patch('/update/:postId', protect, updatePost)
router.get('/my-posts', protect, getMyPosts)
router.get('/get-posts', protect, getPostsOfFollowing)
router.get('/get-posts', protect, getPostsOfFollowing)
router.patch('/like-unlike/:postId', protect, likeUnlikePost)
router.delete('/delete/:postId', protect, deletePost) // to be compelted
router.route('/comment/:postId').patch(protect, addComment)
router.route('/comment/:postId/:commentId').patch(protect, updateComment).delete(protect, deleteComment)

module.exports = router