import express from "express";

import { getAllUsers, AddUser, GetSingleUser, UpdateUser, DeleteUser, FollowUser, UnFollowUser, signUp, signIn } from "../controllers/user.controller";

const router = express.Router();

router.get("/get-users", getAllUsers);
router.post("/add-user", AddUser);
router.get("/get-single-user/:user_id", GetSingleUser);
router.put("/update-user/:user_id", UpdateUser);
router.delete("/delete-user/:user_id", DeleteUser);
router.put("/follow-user/:user_id", FollowUser);
router.put("/unfollow-user/:user_id", UnFollowUser);
router.post("/sign-up", signUp);
router.post("/sign-in", signIn);

export default router;
