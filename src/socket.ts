import { Server,} from "socket.io"
import http from "http"
import * as messageHandler from "./eventHandlers/messagehandler"
import * as channelHandler from "./eventHandlers/channelHandler"
import { initialSocketSetup } from "./helpers/socketSetup"
import { RequestionExtension, SocketExtension } from "./type"
import helmet from "helmet"
import { NextFunction, Request, Response } from "express"
import { authenticate } from "./middleware/authenticate"
import morgan from "morgan"

export default (httpServer: http.Server)=>{
    const io= new Server(httpServer)
    io.engine.use(helmet())
    io.engine.use(authenticate)
    io.engine.use(morgan("dev"))
    io.on("connection", async (socket)=>{
        console.log("connected")
        await initialSocketSetup(io, socket as SocketExtension)
        // mesage event handlers
        socket.on("message:send", messageHandler.sendMessage(io,socket))
        socket.on("message:read", messageHandler.readMessages(io,socket))
        socket.on("message:delete", messageHandler.deleteMessages(io,socket))
        socket.on("message:get", messageHandler.getMessages(io,socket))

        // channel event handlers
        socket.on("channel:add:members", channelHandler.addGroupMembers)
        socket.on("channel:create", channelHandler.createGroupChannel(io,socket))
        socket.on("channel:deactivate", channelHandler.deactivateChannel(io,socket))
        socket.on("channel:delete", channelHandler.deleteChannel)
        socket.on("channel:remove:members", channelHandler.removeGroupMembers)
        socket.on("channel:remove:self", channelHandler.removeGroupMembership)
        socket.on("channel:update", channelHandler.updateChannel(io,socket))

        // user event handlers

    })
}