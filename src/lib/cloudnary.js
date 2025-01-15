import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();
cloudinary.config({
  cloud_name: process.env.CLOUDNIARY_CLOUD_NAME,
  api_key: process.env.CLOUDINIARY_API_KEY,
  api_secret: process.env.CLOUDINIARY_API_SECRET,
});

const options = {
  folder: "chat-app",
  resource_type: "auto",
};

export default cloudinary;
