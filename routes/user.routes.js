const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const {CustomerModel, BusinessModel} = require('../models/user.model');

router.use((req,res,next) => {
    if(req.session.usertype == 'customer'){
        next();
    }
    else{
        res.redirect('/')
    }
})
router.get('/',(req,res)=>{
    let usertype = req.session.usertype;
    BusinessModel.find()
        .then((restaurants)=>{
            let matches;
            if(req.session.matches) { matches = req.session.matches;}
            res.render('user/search.hbs',{usertype, restaurants, matches});
        })
    
});

router.post('/search',(req,res)=>{
    const {city, cuisine} = req.body;
    if(city !== 'Choose...' && cuisine === 'Choose...'){
        BusinessModel.find({"location.city": city})
            .then((matches)=>{
                req.session.matches = matches;
                console.log(req.session)
                res.redirect('/user');
            });
    }
    else if(city === 'Choose...' && cuisine !== 'Choose...'){
        BusinessModel.find({cuisine:cuisine})
            .then((matches)=>{
                req.session.matches = matches;
                console.log(req.session)
                res.redirect('/user');
            });
    }
    else {
        BusinessModel.find({"location.city": city, cuisine:cuisine})
            .then((matches)=>{
                req.session.matches = matches;
                console.log(req.session)
                res.redirect('/user');
            });
    }
});

router.get('/logout',(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/');
    })
});

router.get ('/order/:id', (req, res)=>{
    BusinessModel.findById(req.params.id).populate('menu')
        .then((result)=>{
            console.log(result)
            res.render ('user/order.hbs', {dish: result.menu, id: result._id})
        })
        .catch(err => console.log('Could not find restaurant. Error is: '+ err))

})

router.post ('/order/:id', (req, res)=>{
    // BusinessModel.findById(req.params.id).populate('menu')
    //     .then((result)=>{
    //         console.log(result)
            res.redirect ('/user')
        })
//         .catch(err => console.log('Could not find restaurant. Error is: '+ err))

// })

module.exports = router;