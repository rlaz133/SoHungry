const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const cloudinary = require('cloudinary').v2;
const {CustomerModel, BusinessModel} = require('../models/user.model');
const DishModel = require('../models/dish.model');


router.use((req,res,next) => {
    if(req.session.usertype == 'business'){
        next();
    }
    else{
        res.redirect('/')
    }
})

router.get('/',(req,res)=>{
    BusinessModel.find({_id: req.session.loggedInUser._id})
    .populate('logo')
    .then((restaurant)=>{
        let logo = cloudinary.image(restaurant[0].logo.image.public_id);
        let logoSrc = logo.slice(10,logo.length - 4);
        res.render('business/myrestaurant.hbs', {restaurant: restaurant[0], logoSrc});
    })
    .catch((err) => console.log ('Could not find restaurant. Error: ', err))
});

router.get('/menu',(req,res)=>{
    let imgId;
    let img;
    if(req.session.dishPhoto){
        let dishImg = req.session.dishPhoto;
        imgId = req.session.dishPhoto._id;
        currentImg= cloudinary.image(dishImg.image.public_id, { transformation: { width: 300, height: 200, crop: "pad" }});
        
    }
    BusinessModel.findById({_id:req.session.loggedInUser._id})
        .populate({
            path:'menu'
        })
        .then((restaurantInfo)=>{
            console.log(restaurantInfo)
            res.render('business/mymenu.hbs',{restaurantInfo, currentImg})
        });
});

router.get('/logout',(req,res)=>{
    req.session.destroy(res.redirect('/'))
    
});

router.post('/', (req, res)=>{
    let {userName, cuisine, capacity, description, city, address, logo, email} = req.body;
    let RestaurantID = req.session.loggedInUser._id;
    BusinessModel.findByIdAndUpdate(RestaurantID, {$set: {userName, cuisine, capacity, description, "location.city": city, "location.address": address, logo, email}})
        .then(()=>res.redirect('/business'))
        .catch((err)=> console.log ('Could not upload the profile. Error is: ', err))
});

router.post('/addDish',(req,res)=>{
    const {name, price} = req.body;
    const reg = new RegExp('^[0-9]+(\.\[0-9]{1,2})?$');
    if(!reg.test(price)) {
        res.status(500).render('business/mymenu.hbs', {errorMessage: 'Please enter a valid price: ..000.00'})
        return;
    }
    else{
        DishModel.create({name: name, price: price, photo: cloudinary.image(req.session.dishPhoto.image.public_id, { transformation: { width: 300, height: 200, crop: "pad" }})}) //We create the new dish
        .then((dishToReference)=>{
            BusinessModel.findById(req.session.loggedInUser._id) //Show the logged restaurant
                .then((currentBusiness)=>{
                    let currentDishes = currentBusiness.menu; //And extract the current dishes
                    currentDishes.push(dishToReference._id); //Then we add the new dish to the current dishes arr
                    BusinessModel.findOneAndUpdate({_id:currentBusiness._id},{$set:{menu: currentDishes}})
                        .then(()=>{
                            res.redirect('/business/menu')
                        })
                }); 
            });
    }
});

router.post('/editDish/:id',(req,res)=>{
    const {name, price} = req.body;
    const dishId = req.params.id;
    DishModel.findByIdAndUpdate(dishId, {name: name, price: price})
        .then(()=>{
            res.redirect('/business/menu')
        });
});

router.get('/delete/:id',(req,res)=>{
    DishModel.findByIdAndDelete(req.params.id)
        .then(()=>{
            BusinessModel.findById(req.session.loggedInUser._id) //Show the logged restaurant
                .then((currentBusiness)=>{
                    let currentDishes = currentBusiness.menu; //And extract the current dishes
                    let indexToDelete  = currentDishes.indexOf(req.params.id)
                    currentDishes.splice(indexToDelete,1); //Then we add the new dish to the current dishes arr
                    BusinessModel.findOneAndUpdate({_id:currentBusiness._id},{$set:{menu: currentDishes}})
                        .then(()=>{
                            res.redirect('/business/menu');
                        })
                }); 
        });          
});

module.exports = router;