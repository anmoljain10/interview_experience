var express=require('express');
var router=require('express').Router();


router.get('/', function(req, res){
    res.render('search');
});

//about us page
router.get('/about',function(req,res)
{
res.render('about');
});
router.get('/about/#h1',function(req,res)
{
res.redirect('about/#h1');
});
router.get('/admin',function(req,res){
res.render('admin/admin');
});

module.exports=router;
