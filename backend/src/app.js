import express from "express";
import cors from "cors";

export function createApp(){

    const app = express();
    const cors = cors();

    app.use(cors());


}