var express = require('express');
var router = require('express').Router();
var mongoose = require('mongoose');
var app = express();
var mongo = require('mongodb').MongoClient;
var assert = require('assert');
var bodyParser = require('body-parser');
var url = 'mongodb://localhost:27017/mydatabase';
const user = require('../project/models/user');
const post = require('../project/models/post');
const reply = require('../project/models/reply');
var routes = require('../project/routes/route');
var adminroute = require('../project/adminroutes/adminroutes');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var cookieParser = require('cookie-parser');
var session = require('express-session');
const randomstring = require('randomstring');
var flash = require('express-flash');
var sessionStore = new session.MemoryStore;
const transporter = require('../project/mailer/mail');

app.use(bodyParser.json());                                   //middleware
app.use(express.static('public'));
app.use(routes);
app.use(adminroute);
app.use(session({
  secret: 'guessit',
  saveUninitialized: false,
  resave: false,
  cookie: {
    expires: 1000000
  }
}));
app.use(flash());
app.use(cookieParser('guessit'));
app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.username) {
    res.clearCookie('user_sid');
  }
  next();
});
var sessionChecker = (req, res, next) => {
  if (req.session.username && req.cookies.user_sid) {
    res.redirect('/');
  } else {
    next();
  }
};
app.use(function (req, res, next) {
  // if there's a flash message in the session request, make it available in the response, then delete it
  res.locals.sessionFlash = req.session.sessionFlash;
  delete req.session.sessionFlash;
  next();
});

app.set('view engine', 'ejs');
mongoose.connect('mongodb://localhost:27017/mydatabase');
//for inserting user info
app.post("/adduser", urlencodedParser, function (req, res) {
  var array = (req.body.interests).split(',');
  var secrettoken = randomstring.generate();
  console.log(array);
  new user({
    username: req.body.usrname,
    _id: req.body.email,
    password: req.body.psw,
    interest: array,
    postcount: 0,
    replycount: 0,
    active: false,
    secrettoken: secrettoken
  }).save(function (err, doc) {
    mongoose.connection.close();
    if (err) {
      res.redirect('/', { message: 'user already exists' });
    }
    else {
      req.session.username = doc.username;
      var mailOptions = {
        from: 'anmoljain2040@gmail.com',
        to: doc._id,
        subject: 'Verify WitSpace account',
        text: 'copy and paste this unique code to verify your account: ' + doc.secrettoken + ' For username:' + doc.username
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      res.render('verify');
    }
  });
});

//login authentication...
var sess;
app.get(sessionChecker, (req, res) => {
  res.redirect('home');
}).post("/login", urlencodedParser, function (req, res) {
  mongo.connect(url, function (err, db) {
    assert.equal(null, err);
    db.collection('user-infos').findOne({ _id: req.body.email, password: req.body.psw }, function (err, result) {
      if (err) {
        res.send(err);
      }
      if (result != null && result.length != 0) {
        var resultArray = [];
        req.session.username = result.username;
        req.session.interest = result.interest;
        getposts(req, res);
      }
      else {
        res.redirect('/');
      }
    });
  });
});


//search results.
app.post('/getdata', urlencodedParser, function (req, res) {
  var resultArray = [];
  mongo.connect(url, urlencodedParser, function (err, db) {
    assert.equal(null, err);
    var cursor = db.collection('post').find({ $or: [{ _id: req.body.sear }, { category: req.body.sear }] });
    cursor.forEach(function (doc, err) {
      assert.equal(null, err);
      resultArray.push(doc);
    }, function () {

        if (!req.session.username) { res.render('home', { items: resultArray, success: false, posted: false }); }
        else {
          db.collection('user-infos').findOne({ username: req.session.username }, function (err, result) {
            res.render('home', { items: resultArray, success: true, user: result, posted: false });
            db.close();
          });
        }
      });
  });
});




app.post('/verify', urlencodedParser, function (req, res) {
  if (req.session.username) {
    console.log(req.session.username);
    mongo.connect(url, urlencodedParser, function (err, db) {
      assert.equal(null, err);
      db.collection('user-infos').findOne({ username: req.session.username, secrettoken: req.body.secret }, function (err, result) {
        if (err) {
          res.send(err);
        }
        else if (result != null && result.length != 0) {
          var resultArray = [];
          sess = req.session;

          sess.username = result.username;
          var cursor = db.collection('post').find({ _tags: result.interest });
          cursor.forEach(function (doc, err) {
            assert.equal(null, err);
            resultArray.push(doc);
          }, function () {
              db.close();
              res.render('home', { user: result, posted: false, success: true, items: resultArray });
            });
        }
        else {
          res.redirect('/');
        }

      });
    });
  }
});

//saving the post
app.post('/postexp', urlencodedParser, function (req, res) {
  var date = new Date();
  var array = (req.body.tags).split(',');
  new post({
    _id: req.body.title,
    username: req.session.username,
    category: array,
    post: req.body.postit,
    upvote: 0,
    downvote: 0,
    date: date
  }).save(function (err, doc) {
    if (err) {
      res.send(err);
    }
    else {
      mongo.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('user-infos').findOne({ username: req.session.username }, function (err, result) {
          db.collection('user-infos').updateOne({ username: result.username }, { $set: { postcount: result.postcount + 1 } });
          res.render('home', { success: true, user: result, post: doc, posted: true });
          db.close();
        });
      });
    }
  });
});


app.get('/postq', function (req, res) {
  if (req.session.username) {
    res.render('postq');
  } else {
    res.redirect('/');
  }

});


app.get('/logout', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/');
    }
  });
});

function getuserinfo(req, res, resultArray, action) {
  mongo.connect(url, function (err, db) {
    assert.equal(null, err);
    db.collection('user-infos').findOne({ username: req.session.username }, function (err, result) {
      if (action == 1) {
        res.render('home', { success: true, user: result, items: resultArray, posted: false });
      }
      else if (action == 2)
        res.render('profile', { success: true, user: result, items: result });
      else if (action == 3)
        res.render('editprofile', { user: result });
      else if (action == 4) {
        db.collection('user-infos').updateOne({ username: req.session.username }, { $set: { replycount: result.replycount + 1 } }, function (err, result) {
          db.close();
        });
        res.render('comments', { success: true, user: result, comments: resultArray });
      }
      db.close();
    });
  });
}
function getposts(req, res) {
  var resultArray = [];

  mongo.connect(url, function (err, db) {
    assert.equal(null, err);
    var cursor = db.collection('post').find();
    cursor.forEach(function (doc, err) {
      assert.equal(null, err);

      resultArray.push(doc);
    }, function () {
        db.close();
        if (!req.session.username) {
          res.render('home', { success: false, items: resultArray, posted: false });
        }
        else {
          getuserinfo(req, res, resultArray, 1);
        }
      });
  });
}

app.get('/home', function (req, res) {
  getposts(req, res);
});

app.get('/profile', function (req, res) {
  if (req.session.username) {
    resultArray = [];
    getuserinfo(req, res, resultArray, 2);
  }
});
app.get('/editprofile', function (req, res) {
  if (req.session.username) {
    var resultArray = [];
    getuserinfo(req, res, resultArray, 3)
  }
  else {
    res.redirect('/');
  }
});
app.post('/change', urlencodedParser, function (req, res) {
  var resultArray = [];
  var interests = (req.body.interest).split(',');
  mongo.connect(url, function (err, db) {
    assert.equal(null, err);
    if (interests != req.session.interest) {

      db.collection('user-infos').updateOne({ username: req.session.username }, { $set: { interest: interests } }, function (err, result) {
        db.close();
      });

    }
    if (req.body.username != req.session.username) {
      console.log(req.body.username);
      db.collection('user-infos').updateOne({ username: req.session.username }, { $set: { username: req.body.username } }, function () {
        db.close();
      });

      req.session.username = req.body.username;
    }
    getuserinfo(req, res, resultArray, 3);
  });
});
app.post('/comment', urlencodedParser, function (req, res) {
  if (req.session.username) {
    new reply({
      question: req.body.question,
      username: req.session.username,
      comment: req.body.comment
    }).save(function (err, doc) {
      if (err) {
        res.send(err);
      }
      else {
        var resultArray = [];
        mongo.connect(url, function (err, db) {
          assert.equal(null, err);
          var cursor = db.collection('replies').find({ question: req.body.question });
          cursor.forEach(function (doc, err) {
            assert.equal(null, err);
            resultArray.push(doc);
          }, function () {

              db.close();
              getuserinfo(req, res, resultArray, 4);
            });
        });
      }
    });
  }
  else {
    res.redirect('/');
  }
});
app.post('/getcomments', urlencodedParser, function (req, res) {
  var resultArray = [];
  mongo.connect(url, function (err, db) {
    assert.equal(null, err);
    var cursor = db.collection('replies').find({ question: req.body.question });
    cursor.forEach(function (doc, err) {
      assert.equal(null, err);
      resultArray.push(doc);
    }, function () {
        db.close();
        if (req.session.username) {

          getuserinfo(req, res, resultArray, 4);
        }
        else {
          res.render('comments', { success: false, comments: resultArray });
        }
      });
  });
});

app.listen(3000);
module.exports = router;
