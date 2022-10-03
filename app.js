require('dotenv').config();

const express = require("express");
const app = express();
const port = 3000;
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
let ejs = require('ejs');
const { log } = require("console");
const encrypt = require('mongoose-encryption');


// getting-started.js
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://localhost:27017/userDB');

    // use `await mongoose.connect('mongodb://user:password@localhost:27017/test');` if your database has auth enabled
}


const userSchema = new mongoose.Schema({
    email: "String",
    password: "String"
});





//It will encrypt database.
userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] }); // Add the plugin to the schema before the mongoose module.


const User = mongoose.model("User", userSchema);








app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});


app.post("/register", (req, res) => {

    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });


    // User.insertMany([newUser], (error, results) => {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log(results);
    //         res.render("secrets");

    //     }
    // });

    newUser.save() //save can encrypt 
    res.render("secrets");


});


app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    //Looke through the database and see that username and password if is equal.
    User.findOne({ email: username }, (error, result) => {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
            if (result.password === password) {
                res.render("secrets");
            }
        }
    });
});








app.listen(port, (req, res) => {
    console.log("Server has started on port 3000!!!");
});