{Project, User, Comment, Event} = require('../models')
ipn = require('paypal-ipn')



exports.ipn = (req, res) ->
	console.log("deprecated")
	return res.send 410
	res.send 'thanks'

	ipn.verify req.body, 'allow_sandbox' : false, (err,mes) ->
		return console.log err if err
		Project.findByNumber req.body.item_number, (err,p) ->
			p.addPaypalEscrow req.body, 'Pre escrow for project : ' + p.number , (err) ->
				return console.log  err if err

exports.ipn2 = (req, res) ->
	console.log("deprecated")
	return res.send 410
	res.send 'thanks'
	ipn.verify req.body, 'allow_sandbox' : false, (err,mes) ->
		return console.log  err if err
		users = req.body.item_number.split('_')
		User.findById users[0], (err,u) ->
			return console.log  err if err
			User.findById users[1], (err,user) ->
				return console.log  err if err
				u.revealfrompaypal user, req.body, 'Reveal Number for user : ' + u.name , (err) ->
