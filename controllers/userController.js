const sendEmail = require('../middlewares/sendEmail')
const User = require('../models/User')
const Post = require('../models/Post')
const asyncHandler = require('express-async-handler')
const crypto = require('crypto')
const { use } = require('../routes/userRoutes')

/*
    @desc GET MY PROFILE
    @route GET api/users/me
    @access private
*/
const getMyProfile = asyncHandler(async(req, res) => {
        res.status(200).json(req.user)
})

/*
    @desc UPDATE MY PROFILE
    @route PATCH api/users/me
    @access protected
*/
const updateMyProfile = asyncHandler(async(req, res) => {
    const { firstName, surname, email, gender, birthdate } = req.body
    const id = req.user._id
    const user = await User.findById(id)
    if(user) {
        user.firstName = firstName || user.firstName
        user.surname = surname || user.surname
        user.email = email || user.email
        user.gender = gender || user.gender
        user.birthdate = birthdate || user.birthdate

        // Update the profile pic and cover image HERE

        const updatedUser = await user.save()
        res.status(200).json({
            id: updatedUser._id,
            name: `${updatedUser.firstName} ${updatedUser.surname}`,
            email: updatedUser.email,
            gender: updatedUser.gender,
            birthdate: updatedUser.birthdate
        })
    } else {
        res.status(404)
        throw new Error('User not found.')
    }
})

/*
    @desc GET USER PROFILE : Here the loggedInUser tries to view profile of another registered user
    @route GET api/users/:id
    @access protected : by protectGetUserProfile
*/
const getUserProfile = asyncHandler(async(req, res) => {
    const id = req.params.id
    const user = await User.findById(id).select('-password')
    const isValidated = req.user
    if(user) {
        if(isValidated) {
            res.status(200).json(user)
        } else {
            res.status(200).json({
                id: user._id,
                name: `${user.firstName} ${user.surname}`,
                email: user.email,
                gender: user.gender,
                datebrith: user.datebrith
            })
        }
    } else{
        res.status(404)
        throw new Error(`User with id - ${id} not found.`)
    }

})

/*
    @desc FOLLOW/UNFOLLOW USER
    @route PATCH api/users/:id
    @access protected
*/
const followUnfollowUser = asyncHandler(async(req, res) => {
    const userToFollowId = req.params.id 
    const loggedInUserId = req.user._id.toString()
    const userToFollow = await User.findById(userToFollowId)
    const loggedInUser = await User.findById(loggedInUserId)

    if(loggedInUserId === userToFollowId) {
        res.status(400)
        throw new Error('Cannot follow yourself.')
    }

    // follow the user if not already followed
    if(!loggedInUser.following.includes(userToFollowId)) {
        loggedInUser.following.push(userToFollowId)
        userToFollow.followers.push(loggedInUserId)

        await loggedInUser.save()
        await userToFollow.save()

        return res.status(200).json({
            message: `User followed : ${userToFollowId}`
        })
    }

    //  unfollow the user if already followed
    let index
    index = loggedInUser.following.indexOf(userToFollowId)
    loggedInUser.following.splice(index, 1)

    index = userToFollow.followers.indexOf(loggedInUserId)
    userToFollow.followers.splice(loggedInUserId)

    await loggedInUser.save()
    await userToFollow.save()

    res.status(200).json({
        message: `User unfollowed : ${userToFollowId}`
    })

})

/*
    @desc UPDATE PASSWORD
    @route PATCH api/users/me/update-password
    @access protected
*/
const updatePassword = asyncHandler(async(req, res) => {
    const { password: newPassword } = req.body
    const id = req.user._id
    const user = await User.findById(id)

    if(user) {
        if(!(await user.matchPassword(newPassword))) {
            user.password = newPassword || user.password
            await user.save()
            res.status(200).json({
                message: 'Updated password.'
            })
        } else {
            res.status(400)
            throw new Error('Entered password same as current password.')
        }
    } else {
        res.status(400)
        throw new Error('User not found.')
    }
})

/*
    @desc FORGOT PASSWORD : Allows users to send password reset link to their email
    @route PATCH api/users/forgot-password
    @access public
*/
const forgotPassword = asyncHandler(async(req, res) => {
    const { email } = req.body 
    const user = await User.findOne({ email })

    if(!user) {
        res.status(404)
        throw new Error('User not found.')
    }

    const resetToken = await user.getResetPasswordToken()

    //setup url to be sent in email via nodemailer
    const resetUrl = `${req.protocol}://${req.get("host")}/api/users/me/reset-password/${resetToken}`
    message = `To reset password click <a href="${resetUrl}">here</a>`

    console.log(message)

    //Send email using nodemailer
    const options = {
        email: user.email,
        subject: 'Reset password.',
        text: '',
        html: message
    }
    await sendEmail(options)

    res.status(200).json({
        message: `Password reset link sent to email : ${user.email}`
    })
})

/*
    @desc RESET PASSWORD : Allows users to reset their link after visitig the link sent by above route controller
    @route PATCH api/users/reset-password
    @access public
*/
const resetPassword = asyncHandler(async(req, res) => {
    //get token from the url
    const resetToken = req.params.resetToken

    //create a hash using similar to that created in databse User.js
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    //find user by the hash
    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpiry: { $gt: Date.now() }
    })

    if(!user) {
        res.status(404)
        throw new Error('Invalid or expired token.')
    }

    //if user is found, update the password
    user.password = req.body.password

    //reset all tokens
    user.resetPasswordToken = undefined
    user.resetPasswordExpiry = undefined

    await user.save()

    res.status(200).json({
        message: 'Password succesfully reset.'
    })

})

/*
    @desc DELETE MY PROFILE : Allows users to delete their profile including all of their posts and other info.
    @route PATCH api/users/reset-password
    @access private
*/

const deleteProfile = asyncHandler(async(req, res) => {
    const userId = req.user._id
    const user = await User.findById(userId)

    //for deleting profile, user must have to enter the correct passsword one last time --sadTone
    const { password } = req.body
    if(!(await user.matchPassword(password))) {
        res.status(400)
        throw new Error('Incorrect password.')
    }

    // delte user account and logout just after deleting
    await User.findByIdAndDelete(userId)
    res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true
    })

    //delte all posts of that user
    await Post.deleteMany({owner: userId})

    //remove him from followers of other users
    const followers = user.followers
    followers.forEach(async(follower) => {
        const user = await User.findById(follower)
        const index = user.following.indexOf(userId)
        user.following.splice(index, 1)
        await user.save()
    });

    //remove him from followings of other users
    const followings = user.following
    followings.forEach(async(following) => {
        const user = await User.findById(following)
        const index = user.followers.indexOf(userId)
        user.followers.splice(index, 1)
        await user.save()
    });

    //remove him from likes[] of all posts
    const likedPosts = await Post.find({ likes: userId })
    likedPosts.forEach(async(post) => {
        const index = post.likes.indexOf(userId)
        post.likes.splice(index, 1)
        await post.save()
    });

    // comment removal function not implemented


    res.status(200).json({
        message: 'User profile deleted.'
    })
    
})

module.exports = {
    getMyProfile,
    updateMyProfile,
    getUserProfile,
    followUnfollowUser,
    updatePassword,
    forgotPassword,
    resetPassword,
    deleteProfile
}