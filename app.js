const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");

const bodyParser = require("body-parser");

const app = express();

//Setting View engine of  EJS
app.set("view engine", "ejs");

//To uses the css and js files
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

//Connecting mongoose with mongodbb
mongoose.connect("mongodb://localhost:27017/healthDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useNewUrlParser", true);
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

//Creating schema for mogoose
const userSchema = new mongoose.Schema({
  name: String,
  age: String,
  address: String,
  phone: Number,
  email: String,
});

//Creating moodel for mogodb
const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("index");
});

app.post("/", function (req, res) {
  let newDetails = new User({
    name: req.body.name,
    age: req.body.age,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
  });
  newDetails.save();

  res.render("index");
});

app.listen(3000, function (req, res) {
  console.log("Server running at 3000");
});
