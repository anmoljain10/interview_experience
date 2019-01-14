var mongoose=require('mongoose');

var Schema=new mongoose.Schema({
comment:String,
username:String,
question:String



});
var reply=mongoose.model('reply',Schema); 
module.exports=reply;
