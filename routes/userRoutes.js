const express = require("express");
const {
    protect,
    protectGetUserProfile,
} = require("../middlewares/authMiddleware");
const {
    getMyProfile,
    updateMyProfile,
    getUserProfile,
    followUnfollowUser,
    updatePassword,
    forgotPassword,
    resetPassword,
    deleteProfile,
} = require("../controllers/userController");
const { notFound, handleError } = require("../middlewares/errroMiddleware");

const router = express.Router();

//User routes go here
router.route("/me").get(protect, getMyProfile).patch(protect, updateMyProfile);
router
    .route("/:id")
    .get(protectGetUserProfile, getUserProfile)
    .patch(protect, followUnfollowUser);
router.patch("/me/update-password", protect, updatePassword);
router.patch("/me/forgot-password", forgotPassword);
router.patch("/me/reset-password/:resetToken", resetPassword);
router.delete("/me/delete-profile", protect, deleteProfile);  // to be completed

module.exports = router;
