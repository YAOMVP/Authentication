require('dotenv').config();
const express = require("express");
const app = express();
const port = 3000;
let ejs = require('ejs');
// const sha512 = require('js-sha512');
// var bcrypt = require('bcryptjs');
// var salt = bcrypt.genSaltSync(10);
const { log } = require("console");
// const encrypt = require('mongoose-encryption');
const session = require('express-session'); //Import "express-session" library
const passport = require("passport"); // Import the primary "Passport JS" library
const passportLocalMongoose = require('passport-local-mongoose'); //Users could be authenticated against a username/password saved in a database that created locally.

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));


//This is the basic express session({..}) initialization.Applications must initialize session support in order to make use of login sessions.
//This is the secret used to sign the session ID cookie.The resave field forces the session to be saved back to the session store, and the saveUninitialized field forces a session that is “uninitialized” to be saved to the store.
app.use(session({
    secret: "Olivia likes hot pot!!!",
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize())
    // init passport on every route call.
app.use(passport.session())
    // allow passport to use "express-session".

// getting-started.js
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/userDB'); // Give it the path to our database

    // use `await mongoose.connect('mongodb://user:password@localhost:27017/test');` if your database has auth enabled
}


const userSchema = new mongoose.Schema({ //Define our data structure.
    email: "String",
    password: "String",
    googleId: String
});


userSchema.plugin(passportLocalMongoose); //To hash and salt our passwords and to save users into mongoDB database. 
userSchema.plugin(findOrCreate);

//Then, we create a model from that userSchema. The first parameter is the name of the collection in the database. The second one is to set up mongoose to use the userSchema
const User = mongoose.model("User", userSchema);


//Implementing Passport Local Authentication. Right below the mongoose model:

//The createStrategy is responsible to setup passport-local LocalStrategy with the correct options,on our User model — courtesy of passport-local-mongoose — which takes care of everything so that we don’t have to set up the strategy. Pretty handy.
passport.use(User.createStrategy());
//To maintain a login session, Passport serializes and deserializes user information from the session.
// passport.serializeUser(User.serializeUser()); //Serialize the user instance with the information we pass on to it and store it in the session via a cookie.
// passport.deserializeUser(User.deserializeUser()); //Deserialize the instance, providing it the unique cookie identifier as a “credential”.

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});








passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function(accessToken, refreshToken, profile, cb) {
        console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function(err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", (req, res) => {
    res.render("home");
});


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));


app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });












app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    //The “req.isAuthenticated()” function can be used to protect routes that can be accessed only after a user is logged in
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});


app.post("/register", (req, res) => {
    //hash function passing in the password that the user typed in, and the number of rounds of salting we want to do, and becrypt will generate the random salt and also hash our password with the number of salt rounds that we designed.
    // bcrypt.genSalt(10, (error, salt) => {
    //     bcrypt.hash("req.body.password", salt, (error, hash) => {
    //         // console.log(hash);
    //         const newUser = new User({
    //             email: req.body.username,
    //             password: hash
    //         });
    //         newUser.save() //save can encrypt 
    //         res.render("secrets");
    //     });
    // });

    // User.insertMany([newUser], (error, results) => {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log(results);
    //         res.render("secrets");

    //     }
    // });


    User.register({ username: req.body.username }, req.body.password, (error, user) => {
        if (error) {
            console.log(error);
            res.redirect("/register");
        } else {
            //The ‘local’ signifies that we are using ‘local’ strategy. 
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });









});


app.post("/login", (req, res) => {
    // const username = req.body.username;
    // //const password = req.body.password;

    // //Looke through the database and see that username and password if is equal.
    // User.findOne({ email: username }, (error, result) => {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         // console.log(result);
    //         // if (result.password === password) {
    //         //     res.render("secrets");
    //         //}
    //         console.log(result);
    //         console.log(result.password);
    //         // console.log(password);
    //         if (result) {
    //             bcrypt.compare("req.body.password", result.password, (error, item) => {
    //                 console.log(item);
    //                 if (item == true) {
    //                     res.render("secrets");
    //                 }
    //             });
    //         }
    //     }
    // });

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, error => {
        if (error) {
            console.log(error);
        } else {
            //We are going to authenticate the user, it means they have successfully logged in and we are going to call passport.authenticate method
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
    });
});



app.get("/logout", (req, res) => {
    req.logout(err => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});



















app.listen(port, (req, res) => {
    console.log("Server has started on port 3000!!!");
});