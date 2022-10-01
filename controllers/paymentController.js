const BigPromise = require("../middlewares/bigPromise");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

exports.sendStripeKey = BigPromise(async (req, res, next) => {
    res.status(200).json({
        stripekey: process.env.STRIPE_API_KEY,
    });
});

exports.captureStripePayment = BigPromise(async (req, res, next) => {

    const paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: 'inr',

        // optional
        metadata: {integration_check: "accept_a_payment"},
      });

      res.status(200).json({
        success: true,
        amount: req.body.amount,
        client_secret: paymentIntent.client_secret,
        // you can optionally send the id as well
        id: paymentIntent.id,
      })
      
});

exports.sendRazorpayKey = BigPromise(async (req, res, next) => {
    res.status(200).json({
        razorpaykey: process.env.RAZORPAY_API_KEY,
    });
});

exports.captureRazorpayPayment = BigPromise(async (req, res, next) => {

    const instance = new Razorpay({ 
        key_id: process.env.RAZORPAY_API_KEY,
        key_secret: process.env.RAZORPAY_SECRET
    });

    const options = {
        amount: req.body.amount,
        currency: "INR",
        receipt: "receipt#1", //can use nanoid for random receipt generation
    };

    const myOrder = await instance.orders.create(options);

    res.status(200).json({
        success: true,
        amount: req.body.amount,
        order: myOrder,
    });

});