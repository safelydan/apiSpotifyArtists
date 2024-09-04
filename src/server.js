import express from "express";
import cors from "cors";
import artistsRoute from "./routes.js"
import emailRoute from './routes.js'
const app = express();

app.use(cors());
app.use(express.static("public"));

app.use('/api', artistsRoute)
app.use('/api', emailRoute)

const port = 2800;

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
