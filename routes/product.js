const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");
const { 
    addProduct,
    getAllProduct, 
    adminGetAllProduct,
    getSingleProductDetails,
    adminUpdateOneProduct,
    adminDeleteOneProduct,
    addReview,
    deleteReview,
    getOnlyReviewsForOneProduct
} = require("../controllers/productController");


// user routes
router.route("/products").get(getAllProduct);
router.route("/product/:id").get(getSingleProductDetails);
router.route("/review").put(isLoggedIn, addReview).delete(isLoggedIn, deleteReview);
router.route("/reviews").get(isLoggedIn, getOnlyReviewsForOneProduct);


// admin routes
router.route("/admin/product/add").post(isLoggedIn, customRole("admin"), addProduct);
router.route("/admin/products").get(isLoggedIn, customRole("admin"), adminGetAllProduct);
router.route("/admin/product/:id")
.put(isLoggedIn, customRole("admin"), adminUpdateOneProduct)
.delete(isLoggedIn, customRole("admin"), adminDeleteOneProduct);


module.exports = router;