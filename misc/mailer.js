const nodemailer=require('nodemailer');

const transport = nodemailer.createTransport({
service:'gmail',
auth: {
user :'anmoljain806@gmail.com',
pass :'anmoljain1010'
});
var mailOptions = {
  from: 'anmoljain806@gmail.com',
  to: 'anmoljain2040@gmail.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};
module.exports = {
transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
}); 
}

