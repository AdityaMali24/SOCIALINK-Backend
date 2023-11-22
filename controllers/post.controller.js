import postModel from "../models/post.model";
import UserModel from "../models/User.model";
import multer from "multer";
import fs from "fs";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "./uploads";
    const subFolder = "posts";

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    const subFolderPath = path.join(uploadPath, subFolder);
    if (!fs.existsSync(subFolderPath)) {
      fs.mkdirSync(subFolderPath);
    }

    cb(null, subFolderPath);
  },
  filename: function (req, file, cb) {
    const name = file.originalname;
    const ext = path.extname(name);
    const nameArr = name.split(".");
    nameArr.pop();
    const fname = nameArr.join(".");
    const fullname = fname + "-" + Date.now() + ext;
    cb(null, fullname);
  },
});

const upload = multer({ storage: storage });

// GetAllPosts
export const getAllPosts = async (req, res) => {
  try {
    const postsData = await postModel.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userID",
          foreignField: "_id",
          as: "users",
        },
      },
      { $unwind: "$users" },
    ]);

    if (postsData) {
      return res.status(200).json({
        data: postsData,
        msg: "Success",
      });
    }
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

//GetUserPosts
export const getUserPosts = async (req, res) => {
  try {
    const userID = req.params.user_id;
    const userPosts = await postModel.find({ userID: userID });
    if (!userPosts) {
      return res.status(404).json({ message: "User's posts not found" });
    }
    return res.status(200).json({ data: userPosts });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Add-Posts
export const AddPosts = (req, res) => {
  try {
    const uploadPostImage = upload.single("image");
    uploadPostImage(req, res, async function (err) {
      if (err) return res.status(400).json({ message: err.message });

      const { userID, content, textcontent, image, caption } = req.body;
      let NewPost;

      if (content === "text") {
        NewPost = new postModel({
          userID: userID,
          content: content,
          textcontent: textcontent,
        });
      } else if (content === "image") {
        let image = null;
        if (req.file !== undefined) {
          image = req.file.filename;
        }
        NewPost = new postModel({
          userID: userID,
          content: content,
          image: image,
          caption: caption,
        });
      } else {
        return res.status(400).json({
          msg: 'Invalid content type Must be "text" or "image".',
        });
      }
      const savedPost = await NewPost.save();
      return res.status(201).json({
        data: savedPost,
        msg: "Post Added",
      });
    });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Update-Posts
export const UpdatePost = async (req, res) => {
  try {
    const uploadPostImage = upload.single("image");
    uploadPostImage(req, res, async function (err) {
      if (err) return res.status(400).json({ message: err.message });
      const postID = req.params.posts_id;
      const { userID, content, textcontent, image, caption } = req.body;
      const toupdate = {};

      if (content === "text") {
        toupdate.content = content;
        toupdate.textcontent = textcontent;
        toupdate.image = null;
        toupdate.caption = null;
      } else if (content === "image") {
        toupdate.content = content;
        toupdate.textcontent = null;
        toupdate.caption = caption;
      } else {
        return res.status(400).json({
          msg: "Invalid Content Type",
        });
      }

      const updatedPost = await postModel.updateOne(
        { _id: postID },
        {
          $set: toupdate,
        }
      );

      if (updatedPost.acknowledged) {
        return res.status(200).json({
          data: updatedPost,
          msg: "Post Updated",
        });
      }
    });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Delete-Post
export const deletePost = async (req, res) => {
  try {
    const postID = req.params.posts_id;
    const postData = await postModel.findOne({ _id: postID });

    if (fs.existsSync("./uploads/posts/" + postData.image)) {
      fs.unlinkSync("./uploads/posts/" + postData.image);
    }

    const deletePost = await postModel.deleteOne(postData);
    if (deletePost.acknowledged) {
      return res.status(200).json({
        msg: "Post deleted successfully",
      });
    }
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Like-Post
export const likePost = async (req, res) => {
  try {
    const postID = req.params.posts_id;
    const { userID } = req.body;
    const postData = await postModel.findOne({ _id: postID });

    if (!postData) {
      return res.status(404).json({
        msg: "Post not found",
      });
    }

    if (postData.likes.includes(userID)) {
      return res.status(400).json({
        msg: "You have already liked this post",
      });
    }

    postData.likes.push(userID);
    postData.likesCount = postData.likes.length;

    // Save the updated post
    const updatedPost = await postData.save();

    return res.status(201).json({
      msg: "You Liked The Post",
      post: updatedPost,
    });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Unlike-Post
export const unLike = async (req, res)=>{
  try {
    const postID = req.params.posts_id; 
    const { userID } = req.body;

    // Find the post by its ID
    const postData = await postModel.findById(postID);

    if (!postData) {
      return res.status(404).json({
        msg: "Post not found",
      });
    }

    // Check if the user has already liked the post
    const userIndex = postData.likes.indexOf(userID);
    if (userIndex === -1) {
      return res.status(400).json({
        msg: "You have not liked this post yet",
      });
    }

    // Remove the user ID from the likes array and update the likes count
    postData.likes.splice(userIndex, 1);
    postData.likesCount = postData.likes.length;

    // Save the updated post
    const updatedPost = await postData.save();

    return res.status(200).json({
      msg: "You unliked the post",
      post: updatedPost,
    });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};


// Add-Comment on  Post
export const addComment = async (req, res)=>{
  try {
    const postID = req.params.posts_id;
    const{ userID, comments } = req.body;
    const postsData = await postModel.findOne({ _id: postID});

    if(!postsData){
      return res.status(404).json({
        msg: "Post Not Found",
      });
    }

    postsData.comments.push({ userID, comments});
    const updatedData = await postsData.save();

    if (updatedData) {
      return res.status(201).json({
        msg: "Comment Added",
        data: updatedData,
      });
    }
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
}