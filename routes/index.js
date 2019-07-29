var express = require("express");
var router = express.Router();

// Require our controllers
const hotelController = require("../controllers/hotelController");
const userController = require("../controllers/userController");

/* GET home page. */
//router.get("/", hotelController.homePage);
router.get("/", hotelController.homePageFilters);
// router.get("/", (req, res) => {
//   if (req.session.page_views) {
//     req.session.page_views++;
//     res.send(`Number of page visits: ${req.session.page_views}`);
//   } else {
//     req.session.page_views = 1;
//     res.send("First Visit");
//   }
// });

// list all hotels
router.get("/all", hotelController.listAllHotels);
// View single hotel
router.get("/all/:hotel", hotelController.hotelDetail);
// List countries
router.get("/countries", hotelController.listAllCountries);
// List hotels by country
router.get("/countries/:country", hotelController.hotelsByCountry);

router.post("/results", hotelController.searchResults);

// Admin routes:
router.get("/admin", userController.isAdmin, hotelController.adminPage);
router.get("/admin/*", userController.isAdmin);
router.get("/admin/add", hotelController.createHotelGet);
router.post(
  "/admin/add",
  hotelController.upload,
  hotelController.pushToCloudinary,
  hotelController.createHotelPost
);
router.get("/admin/edit-remove", hotelController.editRemoveGet);
router.post("/admin/edit-remove", hotelController.editRemovePost);
router.get("/admin/:hotelId/update", hotelController.updateHotelGet);
router.post(
  "/admin/:hotelId/update",
  hotelController.upload,
  hotelController.pushToCloudinary,
  hotelController.updateHotelPost
);
router.get("/admin/:hotelId/delete", hotelController.deleteHotelGet);
router.post("/admin/:hotelId/delete", hotelController.deleteHotelPost);
router.get("/admin/orders", userController.allOrders);

// User routes
// Sign up user
router.get("/sign_up", userController.signUpGet);
router.post("/sign_up", userController.signUpPost, userController.loginPost);
// login user
router.get("/login", userController.loginGet);
router.post("/login", userController.loginPost);
// logout user
router.get("/logout", userController.logout);
// Capture details of order
router.get("/confirmation/:data", userController.bookingConfirmation);
// Place order
router.get("/order-placed/:data", userController.orderPlaced);
// View account
router.get("/my-account", userController.myAccount);

module.exports = router;
