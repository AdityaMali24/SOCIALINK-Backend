import UserModel from "../models/User.model";
import multer from "multer";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "./uploads";
    const subfolder = "newFolder";

    // Create "uploads" folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    // Create subfolder inside "uploads"
    const subfolderPath = path.join(uploadPath, subfolder);
    if (!fs.existsSync(subfolderPath)) {
      fs.mkdirSync(subfolderPath);
    }

    cb(null, subfolderPath);
  },
  filename: function (req, file, cb) {
    const name = file.originalname; //abc.png
    const ext = path.extname(name); //.png
    const nameArr = name.split("."); //[abc,png]
    nameArr.pop();
    const fname = nameArr.join("."); //abc
    const fullname = fname + "-" + Date.now() + ext; //abc-12345.png
    cb(null, fullname);
  },
});

const upload = multer({ storage: storage });

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const userData = await UserModel.find();
    if (userData) {
      return res.status(200).json({
        data: userData,
        message: "Success",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Add Users
export const AddUser = (req, res) => {
  try {
    const uploadUser = upload.single("ProfilePic");

    uploadUser(req, res, function (err) {
      if (err) return res.status(400).json({ message: err.message });

      console.log(req.body);
      const { username, firstname, lastname, email, password, bio } = req.body;
      const hashedPassword = bcrypt.hashSync(password, 10);

      let ProfilePic = null;
      if (req.file !== undefined) {
        ProfilePic = req.file.filename;
      }
      const createdRecord = new UserModel({
        username: username,
        email: email,
        firstname: firstname,
        lastname: lastname,
        password: hashedPassword,
        ProfilePic: ProfilePic,
        bio: bio,
      });

      createdRecord.save();

      if (createdRecord) {
        return res.status(201).json({
          data: createdRecord,
          message: "Success",
        });
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// Get-Single User
export const GetSingleUser = async (req, res) => {
  try {
    const userID = req.params.user_id;
    const user = await UserModel.findOne({ _id: userID });

    if (user) {
      return res.status(200).json({
        data: user,
        msg: "Success",
      });
    }
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Updaate-User
export const UpdateUser = async (req, res) => {
  try {
    const uploadData = upload.single("ProfilePic");
    uploadData(req, res, async function (err) {
      if (err) return res.status(400).json({ msg: err.msg });

      const userID = req.params.user_id;
      const { username, firstname, lastname, email, password, bio } = req.body;

      const userData = await UserModel.findOne({ _id: userID });
      let proimg = userData.ProfilePic;

      if (req.file !== undefined) {
        proimg = req.file.filename;
        if (fs.existsSync("./uploads/newFolder" + proimg)) {
          fs.unlinkSync("./uploads/newFolder" + proimg);
        }
      }
      let hashedPassword = userData.password;
      if (password) {
        hashedPassword = bcrypt.hashSync(password, 10);
      }
      const updatedData = await UserModel.updateOne(
        { _id: userID },
        {
          $set: {
            username: username,
            firstname: firstname,
            lastname: lastname,
            email: email,
            password: hashedPassword,
            ProfilePic: proimg,
            bio: bio,
          },
        }
      );
      if (updatedData.acknowledged) {
        return res.status(200).json({
          message: "Updated",
        });
      }
    });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Delete-User
export const DeleteUser = async (req, res) => {
  try {
    const userID = req.params.user_id;
    const userData = await UserModel.findOne({ _id: userID });

    if (fs.existsSync("./uploads/newFolder/" + userData.ProfilePic)) {
      fs.unlinkSync("./uploads/newFolder/" + userData.ProfilePic);
    }

    const removeUser = await UserModel.deleteOne(userData);
    if (removeUser.acknowledged) {
      return res.status(200).json({
        message: "Updated",
      });
    }
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Follow-User
export const FollowUser = async (req, res) => {
  try {
    const userToFollow = req.params.user_id;
    const { userID } = req.body;

    const currentUser = await UserModel.findById(userID);

    if (!currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (currentUser.following.includes(userToFollow)) {
      return res.status(403).json({ msg: "You Already Follow this user" });
    }

    await Promise.all([
      UserModel.updateOne(
        { _id: userToFollow },
        { $push: { followers: userID } }
      ),
      UserModel.findByIdAndUpdate(userID, {
        $push: { following: userToFollow },
      }),
    ]);

    return res.status(200).json({ msg: "Followed" });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

// Unfollow-User
export const UnFollowUser = async (req, res) => {
  try {
    const userToUnfollow = req.params.user_id;
    const { userID } = req.body;

    const currentUser = await UserModel.findById(userID);

    if (!currentUser) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (!currentUser.following.includes(userToUnfollow)) {
      return res.status(403).json({ msg: "You are not following this user" });
    }

    await Promise.all([
      UserModel.updateOne(
        { _id: userToUnfollow },
        { $pull: { followers: userID } } // Remove the current user from the followers array of the user to unfollow
      ),
      UserModel.findByIdAndUpdate(userID, {
        $pull: { following: userToUnfollow }, // Remove the user to unfollow from the following array of the current user
      }),
    ]);

    return res.status(200).json({ msg: "Unfollowed" });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};


//Sign-Up
export const signUp = async (req, res) => {
  try {
    const { email,firstname, username, lastname, password } = req.body;
    const existUser = await UserModel.findOne({ email: email });
    if (existUser) {
      return res.status(400).json({
        msg: "User Already Exists.",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const userData = new UserModel({
      email: email,
      username: username,
      firstname: firstname,
      lastname: lastname,
      password: hashedPassword,
    });
    userData.save();
    if (userData) {
      return res.status(201).json({
        data: userData,
        success: true,
        message: "Successfully Registered",
      });
    }
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

//Sign-In
export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const existUser = await UserModel.findOne({ email: email });
    if (!existUser) {
      return res.status(400).json({
        message: "User Does Not Exists!",
      });
    }
    const passwordCompare = await bcrypt.compare(password, existUser.password);
    if (!passwordCompare) {
      return res.status(400).json({
        message: "Invalid Credientials!",
      });
    }

    const token = jwt.sign(
      {
        id: existUser._id,
        email: existUser.email,
      },
      "mysecretkey",
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      data: existUser,
      token: token,
      success: true,
      msg: "Login Successfull!",
    });
  } catch (error) {
    return res.status(400).json({
      msg: error.msg,
    });
  }
};

