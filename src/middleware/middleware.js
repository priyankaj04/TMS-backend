const { rateLimit } = require('express-rate-limit');
const jwt = require('jsonwebtoken');

// * to avoid multiple api calls in short time of period.
const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 10 minutes
	limit: 5, // Limit each IP to 5 requests per `window` (here, per 10 minutes).
	message: { status: 0, msg: 'Too many password tries from this IP, please try again after 10 minutes' },
	headers: true, // Send rate limit info in the headers
})

const VerifyToken = (req, res, next) => {
	try {
		let authorization = req.headers.authorization
		if (!authorization) throw 'error';

		const token = authorization && authorization.replace(/^Bearer\s+/, "");
		const decode = jwt.verify(token, process.env.TOKEN_KEY);

		if (decode.type == 'member' && decode.userid) {
			next();
		}
		else
			return res.status(401).json({ status: 0, message: "User unauthorized." })
	}
	catch (error) {
		console.log("tokenverification-error", error);
		return res.status(401).json({ status: 0, message: "User unauthorized." })
	}
}

module.exports = { limiter, VerifyToken };