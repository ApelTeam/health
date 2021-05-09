const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const bodyParser = require("body-parser");

const app = express();

//Setting View engine of  EJS
app.set("view engine", "ejs");

//To uses the css and js files
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(methodOverride("_method"));

const mongoURI =
  "mongodb+srv://niraj:niraj@cluster0.pmvbf.mongodb.net/healthDB?retryWrites=true&w=majority";
const conn = mongoose.createConnection(mongoURI);

//Connecting mongoose with mongodbb
mongoose.connect(mongoURI, {
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
const Upload = mongoose.model("Upload", userSchema);

let gfs;

conn.once("open", () => {
  //Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("uploads");
});

//Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString("hex") + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: "uploads",
        };
        resolve(fileInfo);
      });
    });
  },
});
const upload = multer({ storage });

app.get("/", function (req, res) {
  res.render("index");
});

app.post("/upload", upload.single("file"), function (req, res) {
  let newDetails = new Upload({
    name: req.body.name,
    age: req.body.age,
    address: req.body.address,
    phone: req.body.phone,
    email: req.body.email,
    file: req.body.file,
  });
  newDetails.save();

  res.render("index");
});

//Display all files in JSON
app.get("/files", function (req, res) {
  gfs.files.find().toArray((error, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({
        error: "No files Exist",
      });
    }

    return res.json(files);
  });
});

//Display one file in JSON
app.get("/files/:filename", function (req, res) {
  gfs.files.findOne({ filename: req.params.filename }, (error, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        error: "No files Exists",
      });
    }

    return res.json(file);
  });
});

//Display image
app.get("/image/:filename", function (req, res) {
  gfs.files.findOne({ filename: req.params.filename }, (error, file) => {
    if (!file || file.length === 0) {
      return res.status(404).json({
        error: "No files Exists",
      });
    }

    // return res.json(file);

    if (file.contentType === "image/jpeg" || file.contentType === "image/png") {
      var readstream = gfs.createReadStream(file.filename);
      readstream.pipe(res);
    } else {
      res.status(404).json({
        error: "Not an Image",
      });
    }
  });
});

//Display users
app.get("/users", function (req, res) {
  return Upload.find({}, function (err, found) {
    if (err) {
      res.send(500);
      return;
    }
    return res.json({
      found,
    });
  });
});

app.listen(3000, function (req, res) {
  console.log("Server running at 3000");
});
