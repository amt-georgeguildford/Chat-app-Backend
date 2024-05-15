import { Server, Socket } from "socket.io"
import { DeleteMessage, GetMessage, Pagination, ReadMessage, ResponseFunc, SendMessage } from "../type"
import * as channelRepository from "../repository/channelRepository"
import * as messageRepsoitory from "../repository/messageRepository"
import { Message} from "@prisma/client"

export const sendMessage= (io: Server, socket: Socket)=>{
    return async (payload: SendMessage, response: ResponseFunc<undefined>)=>{
        try {
            const {channelId,content,fromUserId}= payload
            const channelExist= await channelRepository.getChannelMembersExcept(channelId, [fromUserId])
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            await messageRepsoitory.createOneOnOneMessage({
                channelId,
                content,
                fromUserId,
                channelMembers: channelExist.members
            })

            socket.broadcast.to(`channel-${channelId}`).emit("message:sent", {message: payload})
            response({
                success: true,
                message: "Message sent"
            })
        } catch (error) {
            console.log(error)
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const readMessages= (io: Server, socket: Socket)=>{
    return async (payload: ReadMessage, response: ResponseFunc<ReadMessage>)=>{
        try {
            const {fromChannel,messages,fromUserId,}= payload

            const channelExist= await channelRepository.getChannelById(fromChannel)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel deos exist"
                })
            }

            await messageRepsoitory.markMessageAsread(fromUserId, messages)

            socket.broadcast.to(`channel-${channelExist.id}`).emit("message:read", messages)
            response({
                success: true,
                data: payload
            })
            //  will work group by read message  
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const deleteMessages= (io: Server, socket: Socket)=>{
    return async(payload: DeleteMessage, response: ResponseFunc<DeleteMessage>)=>{
        try {
            const {fromChannel,messages,fromUserId,}= payload

            const channelExist= await channelRepository.getChannelById(fromChannel)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            await messageRepsoitory.deleteMessages(fromUserId,fromChannel,messages)
            response({
                success: true,
                data: payload
            })
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}


export const getMessages= (io: Server, socket: Socket)=>{
    return async (payload: GetMessage, response: ResponseFunc<{messages: Message[], pagination:Pagination}>)=>{
        try {
            const {fromChannel,page,size,fromUserId, readStatus}= payload
            const channelExist= await channelRepository.getChannelById(fromChannel)
            let currentPage= page || 1
            let take= size || 5
            let skip= (currentPage-1) * take
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }
            const {messages,totalItem}= await messageRepsoitory.getMessages({
                channelId: channelExist.id,
                fromUserId,
                skip,
                take,
                readStatus
            })
            response({
                success: true,
                data: {
                    messages,
                    pagination: {
                        hasNext: (skip+messages.length)<=totalItem,
                        hasPrev: currentPage>1,
                        currentPage,
                        totalItem,
                        size
                    }
                }
            })
        } catch (error) {
            
        }
    }
}
