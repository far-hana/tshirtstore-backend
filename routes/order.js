const express = require("express");
const router = express.Router();
const { isLoggedIn, customRole } = require("../middlewares/user");
const {
    createOrder,
    getOneOrder,
    getLoggedInOrders,
    adminGetAllOrders,
    adminUpdateOneOrder,
    adminDeleteOneOrder
} = require("../controllers/orderController");

router.route("/order/create").post(isLoggedIn, createOrder);
router.route("/order/:id").get(isLoggedIn, getOneOrder);
router.route("/myorders").get(isLoggedIn, getLoggedInOrders);

// admin only routes
router.route("/admin/orders").get(isLoggedIn, customRole("admin"), adminGetAllOrders);
router.route("/admin/order/:id").put(isLoggedIn, customRole("admin"), adminUpdateOneOrder)
.delete(isLoggedIn, customRole("admin"), adminDeleteOneOrder);



module.exports = router;