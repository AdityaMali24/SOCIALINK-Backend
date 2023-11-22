import express from "express";

import { getAllPosts, AddPosts, UpdatePost, deletePost, likePost, unLike, addComment, getUserPosts } from "../controllers/post.controller";

const router = express.Router();

router.get("/get-all-posts", getAllPosts);
router.get("/get-user-post/:user_id", getUserPosts);
router.post("/add-post", AddPosts);
router.put("/update-post/:posts_id", UpdatePost);
router.delete("/delete-post/:posts_id", deletePost);
router.post("/like-post/:posts_id", likePost);
router.post("/unlike-post/:posts_id", unLike);
router.post("/add-comment/:posts_id", addComment);

export default router;