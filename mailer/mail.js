
const nodemailer=require('nodemailer');
const transporter = nodemailer.createTransport({
service:'Gmail',
auth: {
user :'anmoljain2040@gmail.com',
pass :'anmoljain070'
}
});
module.exports=transporter;
