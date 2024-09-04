import express from "express"
import getInfo from "./controllers/getInfo.js";
import sendEmailForNewReleases from "./controllers/emailController.js";

const router = express.Router();

router.get("/getArtistInfos", getInfo);
router.get("/sendEmail", sendEmailForNewReleases);

export default router;