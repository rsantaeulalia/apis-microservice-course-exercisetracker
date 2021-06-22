const express = require('express')
const app = express()
const cors = require('cors')
var bodyParser = require('body-parser');

require('dotenv').config()

var mongo = require('mongodb');
var mongoose = require('mongoose');

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true });

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


app.post('/api/users', function (req, res) {
  createAndSaveUser(req.body.username, (err, doc) => {
    if (err) return res.json(err);
    return res.json(doc);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
