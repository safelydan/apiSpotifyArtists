import express from "express";
import cors from "cors";
import artistsRoute from "./routes.js"

const app = express();

app.use(cors());
app.use(express.static("public"));

app.use('/api', artistsRoute)

const port = 2800;

app.listen(port, () => {
  console.log(`Servidor rodando na porta http://localhost:${port}`);
});
