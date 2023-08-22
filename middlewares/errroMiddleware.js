/* 
the beloww middleware catches a notFound error (which was not explicitly thrown as ' throw new Error() ' and then throws it to next midware handleError)
this midware is used at the last after all routes middlewares.If none of routes middlewares execute , we don't explicitly throw error as no 'throw new Error()
is called and hence handleError() doesn't work for them.But using this notFound() middleware we can also catch those notFound errors and pass it to
handleError() middleware.
*/
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`)
    res.status(404)
    next(error)
}

const handleError = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode
    const message = err.message || 'Something went wrong.'

    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV == 'development' ? err.stack : null
    })
}

module.exports = {
    notFound,
    handleError
}