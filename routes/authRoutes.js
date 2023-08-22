const express = require('express')
const { register, login, logout, verifyEmail } = require('../controllers/authController')

const router = express.Router()

//Auth routes go here
router.post('/login', login)
router.post('/register' , register)
router.post('/logout' , logout)
router.post('/verify-email/:verification_token', verifyEmail)  // not properly implemented.

module.exports = router