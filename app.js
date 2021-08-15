const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const Session1 = require("express-session");
const passport = require("passport");
const Hospital = require("./models/Hospital");
const flash = require("connect-flash");

const indexRouter = require("./routes/index");
// const { session } = require("passport");
// const usersRouter = require('./routes/users');

const app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  Session1({
    resave: false,
    saveUninitialized: false,
    secret: "cancerHospitalSecret",
  }),
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(Hospital.serializeUser());
passport.deserializeUser(Hospital.deserializeUser());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
// app.use('/users', usersRouter);

//config database
require("./models/config");

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
