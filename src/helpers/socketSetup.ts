import { Server } from "socket.io";
import * as userRepository from "../repository/userRepository"
import * as channelRepository from "../repository/channelRepository"
import { SocketExtension, UserInfo } from "../type";
export const initialSocketSetup = async (io:Server, socket: SocketExtension)=>{
    const user= socket.request["user"] as UserInfo

    const userChannel= await userRepository.getUserInfo(user.userId)

    // personal channel
    socket.join(`channel-${user.userId}`)

    userChannel.channels.forEach((channel)=>{
        socket.join(`channel-${channel.id}`)
    })
    socket.emit("initial:setup", {user: userChannel})
}

