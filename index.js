import express from "express";
import path from "path";
import mongoose, { model } from "mongoose";
import Jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
const app = express();
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://localhost:27017", {
    dbName: "backend",
  })
  .then(() => console.log("database is conntected"))
  .catch((e) => console.log(e));

const userSchama = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const Users = new mongoose.model("User", userSchama);

app.use(express.static(path.join(path.resolve(), "public")));
app.set("view engine", "ejs");

const isAuthtication = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const tokendecode = await Jwt.verify(token, "sldjfldsjfldsjflds");
    req.user = await Users.findById(tokendecode._id);
    next();
  } else {
    res.redirect("login");
  }
};

app.get("/", isAuthtication, (req, res) => {
  console.log("This is user", req.user);
  res.render("logout", { name: req.user.name });
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if ((!name, !email, !password)) {
    return console.log("please fill all form");
  }

  const user = await Users.findOne({ email });
  if (user) {
    res.redirect("login");
  }

  const hashpassword = await bcrypt.hash(password, 10);
  const userRegister = await Users.create({
    name,
    email,
    password: hashpassword,
  });

  const token = await Jwt.sign({ _id: userRegister._id }, "sldjfldsjfldsjflds");

  res.cookie("token", token);

  res.redirect("/");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email });
  if (!user) {
    return res.render("register");
  }

  const undohashpassword = await bcrypt.compare(password, user.password);

  if (!undohashpassword) {
    return res.render("login", { message: "password is incorrect" });
  }
  const token = await Jwt.sign({ _id: user._id }, "sldjfldsjfldsjflds");

  res.cookie("token", token);

  res.redirect("/");
});

app.listen(3000, (req, res) => {
  console.log("server is working");
});
