const express = require('express');
const jwt = require("jsonwebtoken")
const router = express.Router();


router
	.route("/symbols")
	.get((req, res) => {
		// NO QUERY - SHOW ALL AVAILABLE STOCKS
		//console.log(Object.keys(req.query).length);
		if (Object.keys(req.query).length == 0) {
			req.db.from('stocks').distinct().select('name', 'symbol', 'industry')
				.then((rows) => {
					// RETURN AVAILABLE STOCKS
					//res.json({ Error: false, Message: "Success", Cities: rows })
					res.json(rows)
					return;
				})
				.catch((err) => {
					console.log(err);
					res.json({ "Error": true, "Message": "error executing MySQL query" })
					return;
				})
				return;
		}
		// QUERY STRING EXISTS AND NOT INDUSTRY
		if (!req.query.industry) {
			res.status(400).json({
				error: true,
				message: "Invalid query parameter: only 'industry' is permitted"
			})
			return;
		} else {
			// INDUSTRY GIVEN - SHOW SPECIFIC INDUSTRY/IES
			req.db.from('stocks').distinct().select('name', 'symbol', 'industry').where('industry', 'like', `%${req.query.industry}%`)
				.then((rows) => {
					// INDUSTRY NOT FOUND
					if (Object.keys(rows).length === 0) {
						res.status(404).json({
							error: true,
							message: "Industry sector not found"
						})
						return;
					}
					// INDUSTRY FOUND
					res.json(rows)
					return;
				})
				.catch((err) => {
					console.log(err);
					res.json({ "Error": true, "Message": "error executing MySQL query" })
					return;
				})
		}
	});

router
	.route("/:symbol")
	.get((req, res) => {
		//USER TRIED TO INSERT A URL QUERY STRING
		if (Object.keys(req.query).length > 0) {
			res.status(400).json({
				error: true,
				message: "Date parameters only available on authenticated route /stocks/authed"
			})
			return;
		}
		// STOCK SYMBOL NOT FOUND
		req.db.first().from('stocks').select('*').where('symbol', 'like', req.params.symbol)
			.then((rows) => {
				if (!rows) {
					res.status(404).json({
						error: true,
						message: "No entry for symbol in stocks database"
					})
					return;
				}
				// RETURN REQUESTED STOCK SYMBOL
				res.json(rows)
			})
			.catch((err) => {
				console.log(err);
				res.json({ "Error": true, "Message": "error executing MySQL query" })
			})

	});

const authorize = (req, res, next) => {
	const authorization = req.headers.authorization
	let token = null;

	console.log("Header stuff: " + req.headers)

	// Retrieve token
	if (authorization && authorization.split(" ").length == 2) {
		token = authorization.split(" ")[1]
		console.log("Token: ", token)

	} else {
		return res.status(403).json({
			error: true,
			message: "Authorization header not found"
		});
	}

	// Verify JWT and check expiration date
	try {
		const decoded = jwt.verify(token, process.env.SECRET_KEY)

		if (decoded.exp > Date.now()) {
			return res.status(403).json({
				error: true,
				message: "Token expired"
			})
		}

		// Permit user to advance to route
		next()
	} catch (e) {
		return res.status(403).json({
			error: true,
			message: "invalid signature"
		})
	}
}

router.get("/authed/:symbol", authorize, (req, res) => {

	// INVALID QUERY STRING
	if (Object.keys(req.query).length > 0
		&& !req.query.from
		&& !req.query.to) {
		return res.status(400).json({
			error: true,
			message: "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15"
		});
	}

	// FROM DATE STRING INVALID	
	if (req.query.from) {
		const df = new Date(req.query.from)
		if (isNaN(df.getDate())) {
			return res.status(400).json({
				error: true,
				message: "From date cannot be parsed by Date.parse()"
			});
		}
	}

	// TO DATE STRING INVALID
	if (req.query.to) {
		const dt = new Date(req.query.to)
		if (isNaN(dt.getDate())) {
			return res.status(400).json({
				error: true,
				message: "To date cannot be parsed by Date.parse()"
			});
		}
	}

	req.db.from('stocks').select('*')
		.where((builder) => {
			if (req.query.from) builder.where('timestamp', '>', req.query.from);
			if (req.query.to) builder.where('timestamp', '<=', req.query.to);
		})
		.andWhere('symbol', 'like', req.params.symbol)
		.then((rows) => {
			if (rows.length == 0) {
				let message = ""
				if (req.query.from || req.query.to) message = "No entries available for query symbol for supplied date range"
				else message = "No entry for symbol in stocks database"
				return res.status(404).json({
					error: true,
					message: message
				});
				
			}
			// RETURN STOCKS
			if (req.query.from || req.query.to) return res.json(rows)
			else return res.status(200).json(rows[0])
		})
		.catch((err) => {
			return res.json({ "Error": true, "Message": "error executing MySQL query" })
		})
});

module.exports = router;
