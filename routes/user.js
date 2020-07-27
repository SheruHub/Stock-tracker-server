var express = require('express');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const jwt = require("jsonwebtoken")
var router = express.Router();

/* GET users listing. */

router
	.route("/register")
	// .get((req, res) => {
	//   res.send("getting /user/register");
	// })
	.post((req, res) => {
		//res.send("posting /user/register");
		const email = req.body.email;
		const password = req.body.password;

		// Verify body
		// USERNAME OR PASSWORD BLANK
		if (!email || !password) {
			return res.status(400).json({
				error: true,
				message: "Request body incomplete - email and password needed"
			})
		}

		const queryUsers = req.db.from("users").select("*").where("email", "=", email)
		queryUsers
			.then((users) => {
				// USER EXISTS
				if (users.length > 0) {
					return res.status(409).json({
						error: true,
						message: "User already exists!"
					})

				}

				// CREATE NEW USER
				const hash = bcrypt.hashSync(password, saltRounds)
				const insertUser = req.db.from("users").insert({ email, hash })
				insertUser.then(() => {
					return res.status(201).json({ success: true, message: "User created" })
				})
			})
	});

router
	.route("/login")
	.post((req, res) => {
		const email = req.body.email;
		const password = req.body.password;

		// Verify body

		// EMAIL OR PASSWORD BLANK
		if (!email || !password) {
			return res.status(400).json({
				error: true,
				message: "Request body incomplete - email and password needed"
			})
		}

		const queryUsers = req.db.from("users").select("*").where("email", "=", email)
		queryUsers
			.then((users) => {
				// EMAIL ADDRESS NOT FOUND
				if (users.length == 0) {
					return res.status(401).json({
						error: true,
						message: "Incorrect email or password"
					})
				}

				// Compare password hashes
				const user = users[0]
				bcrypt.compare(password, user.hash)
					.then((match) => {
						if (!match) {
							// PASSWORD DOESN'T MATCH
							return res.status(401).json({
								error: true,
								message: "Incorrect email or password"
							})
						} else {
							// Create and return JWT token
							expires_in = 60 * 60 * 24 // One day
							const exp = Math.floor(Date.now() / 1000) + expires_in;
							const token = jwt.sign({ email, exp }, process.env.SECRET_KEY);
							res.json({ token: token, token_type: "Bearer", expires_in: expires_in });
							return;
						}
					})

			});
	});

module.exports = router;
