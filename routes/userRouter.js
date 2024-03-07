const express = require('express');
const { getAllUsers,createUser,getUser,updateUser,deleteUser,updateMe }
 = require('../controllers/userController');
 const authController = require('../controllers/authController');

const router = express.Router();

router.post("/forgotPassword",authController.forgotPassword);
router.patch("/resetPassword/:token",authController.resetPassword);

router.patch("/updatePassword",authController.protect,authController.updatePassword)

router.patch("/updateMe",authController.protect,updateMe)

router.post("/signup",authController.signup);

router
.route("/login")
.post(authController.login);


router
.route("/")
.get(getAllUsers)
.post(createUser);

router
.route("/:id")
.get(getUser)
.patch(updateUser)
.delete(deleteUser);

module.exports = router;