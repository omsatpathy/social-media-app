const express = require('express')
const dotenv = require('dotenv')
const connectDB = require('./config/dbConfig')
const { notFound, handleError } = require('./middlewares/errroMiddleware')
const cookieParser = require('cookie-parser')

dotenv.config()

connectDB()

const app = express()

//Middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

//Routes middlewares
const auth = require('./routes/authRoutes')
const user = require('./routes/userRoutes')
const post = require('./routes/postRoutes')
app.use('/api/auth', auth)
app.use('/api/users', user)
app.use('/api/posts', post)

//Error middlewares
app.use(notFound)
app.use(handleError)


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})