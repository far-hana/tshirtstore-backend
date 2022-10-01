const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customeError");
const cookieToken = require("../utils/cookieToken");
const fileUpload = require("express-fileupload");
const mailHelper = require("../utils/mailHelper");
const cloudinary = require("cloudinary").v2;
const crypto = require("crypto");

exports.signup = BigPromise(async (req, res, next) => {

    let result;

    if(!req.files) {
        return next(new CustomError("Photo is required for signup", 400));
    }

    const { name, email, password} = req.body;

    if(!email || !name || !password) {
        return next(new CustomError("Name, Email, and password are required", 400));
    }

    let file = req.files.photo;

        result = await cloudinary.uploader.upload(file.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });


    const user = await User.create({
        name,
        email,
        password,
        photo: {
            id: result.public_id,
            secure_url: result.secure_url
        }
    });

    // send user a cookie token 
    cookieToken(user, res);

});

exports.login = BigPromise(async (req, res, next) => {
    const { email, password } = req.body;

    // check for presence of email and password
    if(!email || !password) {
        return next(new CustomError("Email and Password is required", 400));
    }

    // get user from DB
    const user = await User.findOne({email}).select("+password");

    // if user not found in DB
    if(!user) {
        return next(new CustomError("Email or Password does not match or exist", 400));
    }

    // match the password
    const isPasswordCorrect = await user.isValidatedPassword(password);

    // if password does not match
    if(!isPasswordCorrect) {
        return next(new CustomError("Password does not match", 400));
    }

    // if all goes well and we send the token
    cookieToken(user, res);

});

exports.logout = BigPromise(async (req, res, next) => {

    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logout Success",
    });
    
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
    // collect email
    const { email } = req.body;

    // find user in db
    const user = await User.findOne({email});

    // if user not found in db
    if(!user) {
        return next(new CustomError("Email not found", 400));
    }

    // get token from user model method
    const forgotToken = user.getForgotPasswordToken();

    // save user fields in db
    await user.save({ validateBeforeSave: false });

    // create a url
    const myUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${forgotToken}`;

    // craft a message
    const message = `Copy and paste this link in your url and hit enter \n\n ${myUrl}`;

    // attempt to send email
    try {
        await mailHelper({
            email: user.email,
            subject: "TshirtStore - password reset email",
            message,
        });

        // json response if email is success
        res.status(200).json({
            success: true,
            message: "Email sent successfully"
        });
    } catch (error) {
        // reset user fields if things get wrong
        user.forgotPasswordToken = undefined;
        user.forgotPasswordExpiry = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new CustomError(error.message, 500));
    }

});

exports.passwordReset = BigPromise(async (req, res, next) => {
    const token = req.params.token;

    const encryToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

    const user = await User.findOne({
        encryToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    });

    if(!user) {
        return next(new CustomError("Token is either invalid or expired", 400));
    }

    // can do at frontend side
    if(req.body.password !== req.body.confirmPassword) {
        return next(new CustomError("Password and Confirm Password are not same", 400));
    }

    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save();

    // send a json response or send token

    // res.status(200).json({
    //     success: true,
    //     message: "Password changed successfully",
    // });

    cookieToken(user, res);

});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
    // req.user will come from middleware
    // find user by id
    const user = await User.findById(req.user.id);

    // send response and user data
    res.status(200).json({
        success: true,
        user,
    });
});

exports.changePassword = BigPromise(async (req, res, next) => {

    const userId = req.user.id;

    const user = await User.findById(userId).select("+password");

    const isCorrectOldPassword = await user.isValidatedPassword(req.body.oldPassword);

    if(!isCorrectOldPassword) {
        return next( new CustomError("Old Password is incorrect", 400));
    }

    user.password = req.body.newPassword;

    await user.save();

    cookieToken(user, res);
    
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {

    const { name, email } = req.body;

    // check for presence of email and password
    if(!name || !email) {
        return next(new CustomError("Name and Email is required", 400));
    }

    const newData = {
        name: name,
        email: email
    };

    if(req.files) {
        const user = await User.findById(req.user.id);

        const imageId = user.photo.id;

        // deleting image from cloudinary
        const resp = await cloudinary.uploader.destroy(imageId);

        // uploading new image
        result = await cloudinary.uploader.upload(req.files.photo.tempFilePath, {
            folder: "users",
            width: 150,
            crop: "scale"
        });

        newData.photo = {
            id: result.public_id,
            secure_url: result.secure_url,
        };
    }
    
    const user = await User.findByIdAndUpdate(req.user.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
    })

});

exports.adminAllUser = BigPromise(async (req, res, next) => {

    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    });

});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {

    const user = await User.findById(req.params.id);

    if(!user) {
        return next(new CustomError("This user is not found", 400));
    }

    res.status(200).json({
        success: true,
        user
    });

});

exports.adminUpdateOneUser = BigPromise(async (req, res, next) => {

    const { name, email, role } = req.body;

    // check for presence of email and password
    if(!name || !email || !role) {
        return next(new CustomError("Name, Email and Role is required", 400));
    }

    const newData = {
        name: name,
        email: email,
        role: role,
    };

    const user = await User.findByIdAndUpdate(req.params.id, newData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        user
    })

});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {

    const user = await User.findById(req.params.id);
    if(!user) {
        return next(new CustomError("User not found", 401));
    }

    const imageId = user.photo.id;

    await cloudinary.uploader.destroy(imageId);

    await user.remove();

    res.status(200).json({
        success: true,
    });

});

exports.managerAllUser = BigPromise(async (req, res, next) => {

    const users = await User.find({role: "user"}).select("-_id name email");

    res.status(200).json({
        success: true,
        users
    });

});

