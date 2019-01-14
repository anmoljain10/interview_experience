var mongoose=require('mongoose');

var Schema=new mongoose.Schema({
_id:String,
username:String,
category:String,
post:String,
upvote:Number,
downvote:Number,
date:{type:Date, default: Date.now}




},{collection:'post'});
var post=mongoose.model('post',Schema); 
module.exports=post;
