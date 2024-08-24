import express from "express"
import getInfo from "./controllers/artistInfo.js";

const router = express.Router();

router.get("/getArtistInfos", getInfo);

export default router;