const nodemailer = require('nodemailer')
const User = require('../models/User')

const sendEmail = async(options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.USER,
            pass: process.env.PASSWORD,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN
        }
    })

    const mailOptions = {
        from: `"Social Media App" ${process.env.USER}`,
        to: options.email,
        subject: options.subject,
        text: options.text,
        html: options.html,
    }

    transporter.sendMail(mailOptions, async (err, data) => {
        if(err) {
            console.log('Error : ', err)
        } else {
            console.log(`Email sent successfully ${data.messageId}`)
        }
    })
}

module.exports = sendEmail