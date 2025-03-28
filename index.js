const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const Stripe = require('stripe')

const app = express();
app.use(cors());
app.use(express.json({limit : "10mb"}));
const PORT = process.env.PORT || 8080;

//mongodb connection
mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => console.log("Connect to Databse"))
  .catch((err) => console.log(err));

//schema
const userSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  confirmPassword: String,
  image: String,
});

//
const userModel = mongoose.model("user", userSchema);

//api SIGNUP
app.get("/", (req, res) => {
  res.send("server is running");
});
app.post("/signup", async (req, res) => {
//  console.log(req.body);
  const { email } = req.body;

  userModel.findOne({ email: email }, (err, result) => {
    // console.log(result);
    console.log(err);
    if (result) {
      res.send({ message: "Email id is already registered", alert: false });
    } else {
      const data = userModel(req.body);
      const save = data.save();
      res.send({ message: "Successful signup", alert: true });
    }
  });
});

//API LOGIN
app.post("/login", (req, res) => {

  const { email } = req.body;
  userModel.findOne({ email: email }, (err, result) => {
    if (result) {
      console.log(result);
      const dataSend = {
        _id: result._id ,
        firstname:result.firstname ,
        lastname:result.lastname,
        email: result.email,
        image : result.image,
      };
     
      res.send({ message: "login is successful", alert: true , data : dataSend });
    }
    else{
      res.send({ message: "This email is unavailable, Please Sign Up", alert: false ,  }); 
    }
  });
});


//product section

const schemaProduct = mongoose.Schema({
  name : String,
  category : String,
  image : String,
  price : String,
  description : String,
})

const productModel = mongoose.model("product",schemaProduct)

//save product in data
//api
app.post("/uploadProduct",async(req,res) =>{
 // console.log(req.body)
  const data = await productModel(req.body)
  const datasave = await data.save()
  res.send({message : "upload successful"})
})
//
app.get("/product",async(req,res) => {
  const data = await productModel.find({})
  res.send(JSON.stringify(data))
})

//payment gateway
console.log(process.env.STRIPE_SECRET_KEY)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
app.post("/checkout-payment",async(req,res)=>{

 try{
  const params = {
    submit_type : 'pay',
    mode : "payment",
    payment_method_types : ['card'],
    billing_address_collection : "auto",
    shipping_options : [{shipping_rate : "shr_1Ns7HXSBqafDXPFxRnFfnha3"}],
    line_items : req.body.map((item)=>{
      return{
        price_data : {
          currency :  "inr",
          product_data : {
            name : item.name,
            // images : [item.image]
          },
          unit_amount : item.price*100,
        },
        quantity : item.qty
      }
    }),
    success_url : `${process.env.FRONTEND_URL}/success`,
    cancel_url : `${process.env.FRONTEND_URL}/cancel` ,
  }

  const session = await stripe.checkout.sessions.create(params)
  res.status(200).json(session.id)
 }
 catch(err){
  res.status(err.statusCode || 500).json(err.message)
 }
})

//SERVER IS RUNNING
app.listen(PORT, () => console.log("Server is running on port" + PORT));
