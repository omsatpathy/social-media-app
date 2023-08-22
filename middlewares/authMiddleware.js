const jwt = require('jsonwebtoken')
const User = require('../models/User')
const asyncHandler = require('express-async-handler')

const protect = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token
    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = await User.findById(decoded.id).select('-password')

            next()
        } catch (error) {
            res.status(401)
            throw new Error('Not authorized, invalid token.')
        }
    } else {
        res.status(401)
        throw new Error('Not authorized, no token.')
    }
})

/* this is a custom middleware for getUserProfile route : when current user is logged in, he will get all details of requested user including followers and 
following but when no user is logged in, he will only get basic deatails excluding followers and following and posts  
*/
const protectGetUserProfile = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token
    req.user = null
    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            req.user = await User.findById(decoded.id).select('-password')

            next()
        } catch (error) {
            res.status(200)
            next()
        }
    } else {
        res.status(200)
        next()
    }
})

module.exports = {
    protect,
    protectGetUserProfile
}