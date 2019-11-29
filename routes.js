
var _ = require("underscore");
	
exports.index = function(req, res) {
	res.render("index", { 
		// Template data
		title: req.params.catid
	});
};

exports.hello = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;
	
	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('categories');
		
		collection.aggregate().toArray(function(err, items) {
			res.render("hello", { 
				// Underscore.js lib
				_     : _, 
				
				// Template data
				title : "MyShop",
				items : items
			});

			client.close();
		});
	});
};

exports.login = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;
	var bcrypt = require('bcrypt');
	var saltRounds = 10;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('users');
		
		collection.find({'email' : req.query.email}).toArray(function(err, items) {
			if (items.length == 0) {
				client.close();
				res.send(false);
			} else {
				bcrypt.compare(req.query.pass, items[0].pass, function(err, answer) {
					res.send(answer);
				});
			}
		});
	});
}
exports.cart = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('carts');

		if(typeof (req.query.email) == undefined) {
			res.redirect('/login');
			return;
		}

		collection.find({'customerId' : req.query.email}).toArray(function(err, items){
			if (items.length == 0) {
				res.redirect('/');
				return;
			}
			res.render("cart", { 
				// Underscore.js lib
				_     : _, 
				
				// Template data
				title : "MyShop",
				items : items[0].products,
				email : req.query.email
			});
		});
	});	
}

exports.showLogin = function(req, res) {
	res.render("login", { 
		title: "MyShop"
	});
};

exports.register = function(req, res) {
	res.render("register", { 
		title: "MyShop"
	});
};

exports.createAccount = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;
	var bcrypt = require('bcrypt');
	var saltRounds = 10;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('users');
		
		collection.find({'email' : req.query.email}).toArray(function(err, items) {
			if (items.length != 0) {
				res.send(false);
				client.close();
			} else {
				bcrypt.hash(req.query.pass, saltRounds, function(err, hash) {
					var userObject = {
						email : req.query.email,
						pass  : hash
					}
					collection.insertOne(userObject, function(err, response) {
						if (err) throw err;
						console.log("1 document inserted");
						res.send(userObject.email);
						client.close();
					});
				});
			}
		});
	});
}

exports.subcategories = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;
	
	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('categories');
		query = req.params.catid;

		collection.aggregate([
			{
				$unwind: { path : '$categories'}
			},
			{
				$match : {'categories.id' : query}
			},
			{
				$project : {
					id : '$categories.id',
					iamge : '$categories.image',
					categories : '$categories.categories',
					name : '$categories.name',
					page_description : '$categories.page_description',
					page_title : '$categories.page_title',
					parent_category_id : '$categories.parent_category_id',
					c_showInMenu : '$categories.c_showInMenu'
				}
			}	  
		]).toArray(function(err, items) {
			res.render("hello", { 
				// Underscore.js lib
				_     : _, 
				
				// Template data
				title : "MyShop",
				items : items
			});

			client.close();
		});
	});
};




exports.products = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('products');

		collection.find({'primary_category_id': req.params.subcatid }).toArray(function(err, items) {
			res.render("products", { 
				// Underscore.js lib
				_     : _, 
				
				// Template data
				title : "MyShop",
				items : items
			});

			client.close();
		});
	});
}

exports.product = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('products');

		collection.find({'id': req.params.productid }).toArray(function(err, item) {
			res.render("productPage", { 
				// Underscore.js lib
				_     : _, 
				
				// Template data
				title : "MyShop",
				item : item
			});

			client.close();
		});
	});
}

exports.addItem = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('carts');
		
		collection.find({'customerId' : req.query.customerId}).toArray(function(err, items) {
			var itemAdded = false;
			var itemObject = {
				customerId :  req.query.customerId,
				products   : [ {
					id         : req.query.itemID,
					img        : req.query.img,
					name       : req.query.name,
					description: req.query.description,
					quantity   : req.query.quantity,
					price      : req.query.price,
					currency   : req.query.currency
				} ]
			}
			if (items.length == 0) {
				collection.insertOne(itemObject, function(err, response) {
					if (err) throw err;
					res.send(true);
					client.close();
				});
			} else {
				var products = items[0].products;
				for (var i = 0; i < products.length; i++) {
					if (products[i].id == req.query.itemID) {
						products[i].quantity = parseInt(products[i].quantity) + parseInt(req.query.quantity);
						itemAdded = true;
					}
				}

				if (!itemAdded) {
					products[products.length] = itemObject.products[0];
				}

				items[0].products = products;
				item = items[0];

				collection.update({'customerId' : req.query.customerId}, {$set:{'products' : item.products}});
				client.close();
				res.send(true)
			}
		});
	});
}
exports.deleteItem = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('carts');

		collection.update({'customerId' : req.query.email}, { $pull : { 'products' : {'id' : req.query.itemId}}});
		client.close();
		res.redirect('/cart?email='+req.query.email);
	});
}

exports.checkout = function(req, res) {
	res.render("checkout", { 
		// Underscore.js lib
		_     : _, 
		
		// Template data
		title : "MyShop",
		email : req.query.email,
		currency : req.query.currency,
		total : req.query.total
	});
}

exports.completeOrder = function(req, res) {
	var mdbClient = require('mongodb').MongoClient;

	mdbClient.connect("mongodb://localhost:27017/shop", function(err, client) {
		var db = client.db("shop");
		var collection = db.collection('carts');
		
		collection.find({'customerId' : req.body.email}).toArray(function(err, items) {
			var order = {
				customerId :  req.query.customerId,
				orderDetails   : items[0].products,
				customerDetails : {
					name : req.body.name,
					surname : req.body.surname,
					address : req.body.address,
					telephone : req.body.phoneNo,
					CCN : req.body.ccn,
					ExpMonth : req.body.expireMM,
					ExpYear : req.body.expireYY,
					CVC : req.body.cvc
				}
			}

			collection.remove({'customerId' : req.body.email});
			collection = db.collection('orders');
			collection.insertOne(order, function(err, response) {
				if (err) throw err;
				console.log("1 document inserted");
				res.render("orderCompleted", { 
					// Underscore.js lib
					_     : _, 
					
					// Template data
					title : "MyShop"
				});
				client.close();
			});

		});
	});
}