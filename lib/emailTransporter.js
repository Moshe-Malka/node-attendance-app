const nodemailer = require('nodemailer');

// const mailOptions = {
//   from: 'sender@email.com', // sender address
//   to: 'to@email.com', // list of receivers
//   subject: 'Subject of your email', // Subject line
//   html: '<p>Your html here</p>' // plain text body
// };
module.exports = {
  emailTransporter: (opts) => {
    opts.from = process.env.EMAIL_USER;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    transporter.sendMail(opts, (err, info) => {
      if (err) {
        console.log(`[Nodemailer] Error while trying to send email.\n${err}`);
        return { error: true, data: err };
      } else {
        console.log(`[Nodemailer] Successfully sent email.\n${info}`);
        return { error: false, data: info };
      }
    });
  }
};