var mongoose=require('mongoose');

var Schema=new mongoose.Schema({
_id:String,
username:String,
password:String,
interest:[String],
postcount:Number,
replycount:Number,
secrettoken:String,
active:Boolean

});
var user=mongoose.model('user-info',Schema); 
module.exports=user;
