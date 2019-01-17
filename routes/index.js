const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { ensureToken } = require('../lib/ensureToken.js');
const { emailTransporter } = require('../lib/emailTransporter.js');
const { Manager, Worker } = require(path.join(__dirname, './../models/models'));

const saltRounds = 12;

const router = express.Router();

// * GET / *
router.get('/', (req, res, next) => {
  res.render('login');
});

// * POST /login *
router.post('/dashboard', (req, res, next) => {
  Manager.findOne({ username: req.body.username }, (err, user) => {
    if (!user || err) {
      console.log('[Mongoose] User Not Found with username: ' + req.body.username);
      console.log('Login failed');
      return res.render('login', { errors: { content: 'Login Failed !' } });
    }
    bcrypt.compare(req.body.password, user.passwordHash, (err, result) => {
      if (result) {
        let token = jwt.sign({ user }, process.env.JWT_KEY || "hSFt3mIoyY8ePRjaw0ajDYklG2YhzCDlv1wvEa0k3irJMROU41gKgrBE7vOrDgkZ6wzlDHLBpI2m0NZN");
        console.log('Login successfull!');
        // console.log(token);
        // console.log(req.headers);
        return res.render('dashboard', { token: token, username: user.username });
      } else {
        console.log('Login failed');
        return res.render('login', { errors: { content: 'Login Failed !' } });
      }
    });
  });
});

// * GET /dashboard *
router.get('/dashboard', ensureToken, (req, res, next) => {
  console.log(req.token);
  jwt.verify(req.token, process.env.JWT_KEY || "hSFt3mIoyY8ePRjaw0ajDYklG2YhzCDlv1wvEa0k3irJMROU41gKgrBE7vOrDgkZ6wzlDHLBpI2m0NZN", (err, data) => {
    if (err) res.sendStatus(403);
    else {
      res.render('dashboard', { data });
    }
  });
});

// * GET /logout *
router.get('/logout', (req, res, next) => {
  req.token = undefined;
  res.redirect('/');
});

// * GET /register *
router.get('/register', (req, res, next) => {
  res.render('register');
});

// * POST /register *
router.post('/register', (req, res, next) => {
  Manager.findOne({ username: req.body.username }, (err, user) => {
    if (err) return res.render('register', { errors: 'Failed to register new user - probleme with mongoDB' });
    if (!user) {
      bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) return res.render('register', { errors: 'Failed to register new user.' });
        let newUser = new Manager({
          username: req.body.username,
          email: req.body.email,
          passwordHash: hash
        });
        newUser.save((err) => {
          if (err) {
            return res.render('register', { errors: 'Failed to register new user - probleme with mongoDB' });
          } else {
            console.log(`[Mongoose] Succesfully entered new user into db.\n${newUser}`);
            return res.render('register', { success: 'Successfully registered new user !' });
          }
        });
      });
    } else {
      return res.render('register', { errors: 'Failed to register new user - username already in use' });
    }
  });
});

// * GET /forgot *
router.get('/forgot-password', (req, res, next) => {
  res.render('forgot');
});

// * POST /forgot *
router.post('/forgot', (req, res, next) => {
  Manager.findOne({ email: req.body.email }, (err, user) => {
    if (!user || err) {
      console.log('[Mongoose] User Not Found');
      return res.render('forgot', { errors: 'Password Reset Unsuccesfull' });
    } else {
      crypto.randomBytes(48, (err, buffer) => {
        if (err) {
          console.log('[Crypto Lib] Error in crypto lib.');
          return res.render('forgot', { errors: 'Password Reset Unsuccesfull' });
        } else {
          let token = buffer.toString('hex');
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + (3600000 * 4); // 4 hours
          user.save((err) => {
            if (err) {
              console.log('[Mongoose] Saving token to mongo failed');
              return res.render('forgot', { errors: 'Password Reset Unsuccesfull' });
            } else {
              //send email to user with token url. e.g. http://localhost/reset/<token>
              emailTransporter({
                to: user.email,
                subject: 'Password reset link from Comitatus',
                html: `<p>This is your reset link:</p>
                      <br>
                      <a href="${req.headers.host}/reset/${token}">
                        <h2>${req.headers.host}/reset/${token}
                        </h2>
                      </a>`
              });
              return res.render('forgot', {
                success: 'Password Reset Succesfull.',
                content: 'Please check your email account.'
              });
            }
          });
        }
      });
    }
  });
});

// * GET /reset/:token *
router.get('/reset/:token', (req, res) => {
  Manager.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  }, (err, user) => {
    if (!user || err) {
      return res.render('login', { errors: { content: 'Password reset has Failed !' } });
    } else {
      return res.render('tokenPage', { layout: false });
    }
  });
});

// * POST /newpassword *
router.post('/newpassword', (req, res) => {
  Manager.findOne({
    resetPasswordToken: req.body.token,
    resetPasswordExpires: { $gt: Date.now() }
  }, (err, user) => {
    if (err) return res.render('login', { errors: { content: 'Password reset has Failed !' } });
    else if (!user) { // Token expired
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      return res.render('login', { errors: { content: 'Password reset has Failed !' } });
    } else {
      bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        if (err) return res.render('login', { errors: { content: 'Password reset has Failed !' } });
        let newPasswordHash = hash;
        user.passwordHash = newPasswordHash;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.save((err) => {
          if (err) return res.render('login', { errors: { content: 'Password reset has Failed !' } });
          else {
            // send email to user confirmation of changes.
            emailTransporter({
              to: user.email,
              subject: 'Confirmation from Comitatus',
              html: `<p>Your password has been changed. please try and log in to the system.</p><br>`
            });
            return res.render('tokenPage', {
              success: {
                title: 'Password reset successfull !',
                content: 'Please check your email for confirmation and then go to the login page'
              }
            });
          }
        });
      });
    }
  });
});

// * POST /getWorkersByDateRange *
router.post('/getWorkersByDateRange', (req, res, next) => {
  let start_date = req.body.start;
  let end_date = req.body.end;
  Worker.find({
    attandanceTimestamps: {
      $gte: req.body.start,
      $lte: req.body.end
    }
  }, (err, workers) => {
    if (err) {
      console.log('error - mongoose search failed');
      res.send({});
    } else if (workers.length === 0) {
      console.log('error - no such workers found');
      res.send({});
    } else {
      workers.forEach((worker) => {
        worker.attandanceTimestamps = worker.attandanceTimestamps
          .filter(ts => ((ts >= req.body.start) && (ts <= req.body.end)));
      });
      res.send(workers);
    }
  });
});

// * POST /removeTimestampByRFID *
router.post('/removeTimestampByRFID', (req, res, next) => {
  let _rfid = req.body.rfid;
  let ts_rmv = req.body.ts;
  Worker.findOne({ rfid: _rfid }, (err, worker) => {
    if (err) {
      console.log('error - mongoose search failed');
      res.json({ success: false });
    } else if (worker.length === 0) {
      console.log('error - no such rfid found');
      res.json({ success: false });
    } else {
      // delete ts from worker.
      worker.attandanceTimestamps = worker.attandanceTimestamps.filter(ts => ts !== ts_rmv);
      worker.save((err, w) => {
        if (err) {
          console.log('error - failed to save record on db.');
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    }
  });
});

// * POST /addTimestampByRFID *
router.post('/addTimestampByRFID', (req, res, next) => {
  let _rfid = req.body.rfid;
  let newTS = req.body.newTS;
  Worker.findOne({ rfid: _rfid }, (err, worker) => {
    if (err) {
      console.log('error - mongoose search failed');
      res.json({ success: false });
    } else if (worker.length === 0) {
      console.log('error - no such rfid found');
      res.json({ success: false });
    } else {
      worker.attandanceTimestamps.push(newTS);
      worker.save((err, w) => {
        if (err) {
          console.log('error - failed to save record on db.');
          res.json({ success: false });
        } else {
          res.json({ success: true });
        }
      });
    }
  });
});

// * POST /addNewWorker *
router.post('/addNewWorker', (req, res, next) => {
  Worker.find({ $or: [{ name: req.body.fname }, { rfid: req.body.rfid }] },
    (err, user) => {
      if (user.length) {
        console.log(`[Mongoose] User/RFID already in DB.`);
        return res.json({ success: false });
      } else if (err) {
        console.log(`[Mongoose] Error while searching in DB.`);
        return res.json({ success: false });
      } else { // no user with that name OR rfid
        let new_worker = new Worker({
          name: req.body.fname,
          rfid: req.body.rfid,
          attandanceTimestamps: []
        });
        new_worker.save((err) => {
          if (err) {
            console.log(`[Mongoose] Failed to insert new worker into db.`);
            return res.json({ success: false });
          } else {
            console.log(`[Mongoose] Succesfully entered new worker into db.`);
            return res.json({ success: true });
          }
        });
      }
    });
});

module.exports = router;