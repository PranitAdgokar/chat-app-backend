import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudnary from "../lib/cloudnary.js";
import { getReceiverSocketId } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filterUsersId = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filterUsersId);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};

// export const getMessage = async (req, res) => {

//   try {
//     const { id: userToChatId } = req.params;
//     const myId = req.user._id;
//     const messages = await Message.find({
//       $or: [
//         { sender: myId, receiver: userToChatId },
//         { sender: userToChatId, receiver: myId },
//       ],
//     });
//     res.status(200).json(messages);
//   } catch (error) {
//     console.log(error);
//     res.status(500).send(error.message);
//   }
// };

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudnary.uploader.upload(File, options);
      imageUrl = uploadResponse.url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("getMessage", newMessage);
    }

    res.status(200).json(newMessage);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
};
