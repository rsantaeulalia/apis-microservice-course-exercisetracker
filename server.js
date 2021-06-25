const express = require('express')
const app = express()
const cors = require('cors')
var bodyParser = require('body-parser');

require('dotenv').config()

var mongo = require('mongodb');
var mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
});

const userSchema = new mongoose.Schema({
  username: String,
  exercises: { type: [exerciseSchema], default: undefined }
});

const User = mongoose.model('User', userSchema);

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const createAndSaveUser = (user, done) => {
  new User({ username: user })
    .save((err, doc) => {
      if (err) return done(err);
      done(null, { _id: doc._id, username: doc.username });
    });
}

const addExerciseToUser = (id, exercise, done) => {
  User.findOneAndUpdate({ _id: id }, { $push: { exercises: exercise } }, { new: true }, function (err, result) {
    if (result) {
      var resObj = {};
      resObj["_id"] = result._id;
      resObj["username"] = result.username;
      resObj["date"] = exercise.date;
      resObj["duration"] = exercise.duration;
      resObj["description"] = exercise.description;
      done(null, resObj);
    } else {
      done(null, { error: "User not found" });
    }
  });
}

const fetchUsers = (done) => {
  User.find({}, function (err, users) {
    var userMap = [];

    users.forEach(function (user) {
      userMap.push({ _id: user._id, username: user.username });
    });

    done(null, userMap);
  });
}

const fetchExercises = (id, from, to, limit, done) => {
  const query = User.find({ '_id': id });

  if (from) {
    query.where('exercises.date').gte(from);
  }
  if (to) {
    where('exercises.date').lte(to);
  }
  if (limit) {
    query.limit(limit);
  }

  query.exec(function (err, result) {
    if (err) return done(null, err);
    if (result) {
      var resObj = {};
      resObj["_id"] = result._id;
      resObj["username"] = result.username;
      resObj["count"] = result.exercises ? result.exercises.length : 0;
      resObj["log"] = result.exercises;
      res.json(resObj);
      done(null, resObj);
    } else {
      done(null, { error: "User not found" });
    }
  });
}

//USA JSON.parse(data);

app.post('/api/users', function (req, res) {
  createAndSaveUser(req.body.username, (err, doc) => {
    if (err) return res.json(err);
    return res.json(doc);
  });
});

app.post('/api/users/:_id/exercises', function (req, res) {
  const exercise = { description: req.body.description, duration: req.body.duration, date: req.body.date ? req.body.date : new Date() }
  addExerciseToUser(req.params._id, exercise, (err, updatedUser) => {
    if (err) return res.json(err);
    return res.json(updatedUser);
  });
});

app.get('/api/users/:_id/logs', function (req, res) {
  fetchExercises(req.params._id, req.params.from, req.params.to, req.params.limit, (err, userExercises) => {
    if (err) return res.json(err);
    return res.json(userExercises);
  });
});

app.get('/api/users', function (req, res) {
  fetchUsers((err, doc) => {
    if (err) return res.json(err);
    return res.json(doc);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
