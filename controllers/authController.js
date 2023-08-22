const User = require('../models/User')
const jwt = require('jsonwebtoken')
const asyncHandler = require('express-async-handler')
const generateToken = require('../utils/generateToken')
const sendEmail = require('../middlewares/sendEmail')
const crypto = require('crypto')


/*
    @desc REGISTER USER
    @route POST api/auth/register
    @access public
*/
const register = asyncHandler(async(req, res) => {
    const { firstName, surname, email, password, gender, birthdate } = req.body

    // check if user already exists
    const userExists = await User.findOne({ email })
    if(userExists) {
        res.status(400)
        throw new Error('User already exists.')
    }

    // create a new user of above fields
    const user = await User.create({
        firstName,
        surname,
        email,
        password,
        gender,
        birthdate,
    })

    //Send a verification email to user.If user clicks on the email it means verified and redirect user to login page.
    
    const verificationToken = await user.generateVerificationToken()
    const verifyUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email/${verificationToken}`
    const message = `To verify, click <a href="${verifyUrl}">here</a>`

    console.log(message)

    const options = {
        email,
        subject: 'Verify your account.',
        text: '',
        html: message
    }
    await sendEmail(options)

    //On succesfully sending the verification mail, respond with this.
    res.status(200).json({
        message: 'Verification email sent.'
    })
    
})

/*
    @desc VERIFY USER
    @route POST api/auth/verify-email
    @access public
*/
const verifyEmail = asyncHandler(async(req, res) => {
    const verificationToken = req.params.verification_token
    const decode = jwt.verify(verificationToken, process.env.USER_VERIFICATION_TOKEN_SECRET)
    const id = decode.id

    const user = await User.findById(id)

    // if user created successfully, verify and send response
    if(user) {
        user.verified = true
        await user.save()
        res.status(200).json({
            id: user._id,
            name: `${user.firstName + ' ' + user.surname}`,
            email: user.email,
            gender: user.gender,
            birthdate: user.birthdate
        })
    } else {
        res.status(400)
        throw new Error('User verification failed.')
    }
})

/*
    @desc LOGIN USER
    @route POST api/auth/login
    @access public
*/
const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    
    if(user && (await user.matchPassword(password))) {

        //check for verification
        if(!user.verified) {
            res.status(400)
            throw new Error('Please verify your account.')
        }

        generateToken(res, user._id)
        res.status(201).json({
            id: user._id,
            name: `${user.firstName + ' ' + user.surname}`,
            email: user.email,
            gender: user.gender,
            birthdate: user.birthdate
        })
    } else {
        res.status(401)
        throw new Error('Invalid credentials.')
    }
})

/*
    @desc LOGOUT USER
    @route POST api/auth/logout
    @access public
*/
const logout = asyncHandler(async (req, res) => {
    res.cookie('token', '', {
        expires: new Date(0),
        httpOnly: true
    }).status(200).json({
        message: 'User logged out',
    })
})



module.exports = {
    register,
    login,
    logout,
    verifyEmail
}