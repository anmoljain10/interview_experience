var router=require('express').Router();
var mongo=require('mongodb');
var assert=require('assert');
var bodyParser = require('body-parser');
var url='mongodb://localhost:27017/mydatabase';
var urlencodedParser=bodyParser.urlencoded({extended:true});

router.post('/authenticate',urlencodedParser,function(req,res){
mongo.connect(url,function(err,db){
assert.equal(null,err);
db.collection('admin').findOne({username:req.body.username,password:req.body.password},function(err,result){
assert.equal(null,err);
if(err)
{
res.send(err);
}
else if(result!=null && result.length!=0)
{
var resultArray=[];

var cursor=db.collection('post').find({});
cursor.forEach(function(doc,err){
assert.equal(null,err);
resultArray.push(doc);

},function()
{
db.close();
res.render('admin/adminpanel',{posts:resultArray});
});






}
else
{
res.send('username/password does not match');
}
db.close();
});

});
});



router.post('/deletepost',urlencodedParser,function(req,res){
mongo.connect(url,function(err,db){
console.log(req.body.post);
assert.equal(null,err);
db.collection("post").deleteOne({_id:req.body.post},function(err,obj){
if(err)
{
res.send(err);
}
else if(obj.result.n)
{
var resultArray=[];

var cursor=db.collection('post').find({});
cursor.forEach(function(doc,err){
assert.equal(null,err);
resultArray.push(doc);

},function()
{
db.close();
res.render('admin/adminpanel',{posts:resultArray});
});





}
});


});
});
module.exports=router;
