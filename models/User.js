const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required.'],
        maxLength: [30, 'First name should be at most 30 characters.'],
        trim: true
    },
    surname: {
        type:String,
        maxLength: [50, 'Last name should be at most 50 characters'],
        trim: true
    },
    avatar: {
        public_id: String,
        url: String
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        unique: [true, 'User already exists.'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minLength: [6, 'Password should be at least 6 characters.'],
        trim: true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Others'],
        required: [true, 'Gender is required.']
    },
    birthdate: {
        type: Date,
        required: [true, 'Date of birth is required.'],
    },
    posts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verified : {
        type: Boolean,
        required: [true, 'Please verify your account'],
        default: false
    },
        
    resetPasswordToken: {
        type: String,
        default: ''
    },
    resetPasswordExpiry: {
        type: Date,
        default: ''
    }
}, {
    timestamps: true
})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        next()
    }
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

userSchema.methods.getResetPasswordToken = async function () {
    //generate a token 
    const resetToken = crypto.randomBytes(16).toString('hex')

    //generate a hash based on the resetToken
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    //resetPasswordToken is valid only for 5 minutes (here, expressed in milliseconds)
    this.resetPasswordExpiry = Date.now() + 5*60*1000

    await this.save()

    return resetToken
}

userSchema.methods.generateVerificationToken = async function() {
    const verificationToken = jwt.sign({ id: this._id }, process.env.USER_VERIFICATION_TOKEN_SECRET, { expiresIn: '30d' })
    return verificationToken
}

const User = mongoose.model('User', userSchema)
module.exports = User