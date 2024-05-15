import express from "express"
import {Server} from "socket.io"
import {createServer} from "http"
import authRouter from "./routers/authRouter"
import socket from "./socket"
import morgan from "morgan"

const app= express()

const httpServer= createServer(app)

const PORT = process.env["PORT"] || 4000
app.use(express.json())
app.use(morgan("dev"))
app.use("/auth", authRouter)


socket(httpServer)
httpServer.listen(PORT)
