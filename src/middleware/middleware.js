const { rateLimit } = require('express-rate-limit');

// * to avoid multiple api calls in short time of period.
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	limit: 5, // Limit each IP to 5 requests per `window` (here, per 10 minutes).
	message: {status: 0, msg: 'Too many password tries from this IP, please try again after 10 minutes'},
    headers: true, // Send rate limit info in the headers
})

module.exports = { limiter };