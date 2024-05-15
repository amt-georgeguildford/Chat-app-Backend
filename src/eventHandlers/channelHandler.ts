import { Server, Socket } from "socket.io";
import { AddChannelMembers, CreateChannel, DeactivateChannel, DeleteChannel, RemoveGroupMembers, ResponseFunc, UpdateChannel } from "../type";
import { Channel, User } from "@prisma/client";
import * as channelRepository from "../repository/channelRepository"
export const createGroupChannel= (io: Server, socket: Socket)=>{
    return async (payload: CreateChannel, response: ResponseFunc<{channel: Channel}>)=>{
        try {
            const {fromUserId,name}= payload
            const channel= await channelRepository.createChannel({
                name,
                userId: fromUserId,
                type: "GROUP"
            })

            response({
                success: true,
                message: "Group Created successfully",
                data: {
                    channel
                }
            })
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const addGroupMembers= (io: Server, socket: Socket)=>{
    return async (payload: AddChannelMembers, response: ResponseFunc<{channel: Channel}>)=>{
        try {
            const {channelId,fromUserId,members}= payload
            let channelExist= await channelRepository.getChannelById(channelId)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            if(fromUserId!== channelExist.createdBy){
                return response({
                    success: false,
                    message: "You are not authorize"
                })
            }
            const channelMemberMapper= new Map<string, User>()
            channelExist.members.forEach((member)=>{
                channelMemberMapper.set(member.id, member)
            })
            const newMembers= members.filter((userId)=>{
                const memberExist= channelMemberMapper.get(userId)
                return !memberExist
            })
            if(newMembers.length>0){

                await channelRepository.addChannelUsers({
                    channelId,
                    members: newMembers
                })
                channelExist= await channelRepository.getChannelById(channelId)

                // notify new channel members
                newMembers.forEach((member)=>{
                    socket.to(`channel-${member}`).emit("channel:new", {channel: channelExist})
                })
            }
             
            // notify old channel members
            socket.broadcast.to(`channel-${channelId}`).emit("channel:add:member", {channelExist})

            // add socket


            const message=(newMembers.length)+ " " + (newMembers.length>2? "members": "member") +" added"

            response({
                success: true,
                message,
                data: {
                    channel: channelExist
                }
            })
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const deactivateChannel= (io:Server, socket: Socket)=>{
    return async (payload: DeactivateChannel, response: ResponseFunc<{channel: Channel}>)=>{
        try {
            const {channelId,fromUserId}= payload
            let channelExist= await channelRepository.getChannelById(channelId)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            if(fromUserId!== channelExist.createdBy){
                return  response({
                    success: false,
                    message: "You are not authorize"
                })
            }

            await channelRepository.updateChannel(channelId, {
                isActive: false
            })

            channelExist= await channelRepository.getChannelById(channelId)

            // notify channel member
            socket.broadcast.to(`channel-${channelId}`).emit("channel:deactive", {channel: channelExist})

            response({
                success: true,
                message: "Group deactivated",
                data:{
                    channel: channelExist
                }
            })
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const updateChannel= (io: Server, socket: Socket)=>{
    return async (payload: UpdateChannel, response: ResponseFunc<{channel: Channel}>)=>{
        try {
            const {active,name,channelId, fromUserId}= payload
            let channelExist= await channelRepository.getChannelById(channelId)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            if(fromUserId!== channelExist.createdBy){
                return  response({
                    success: false,
                    message: "You are not authorize"
                })
            }

            channelExist=await channelRepository.updateChannel(channelId, {
                isActive: active,
                name
            })

            // notify channel member
            socket.broadcast.to(`channel-${channelId}`).emit("channel:update", {channel: channelExist})

            response({
                success: true,
                message: "Channel updated successfully",
                data: {
                    channel: channelExist
                }
            })
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const deleteChannel= (io:Server, socket: Socket)=>{
    return async(payload: DeleteChannel, response: ResponseFunc<{channel: Channel}>)=>{
        try {
            const {channelId,fromUserId}= payload
            let channelExist= await channelRepository.getChannelById(channelId)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            if(channelExist.createdBy===fromUserId){
                await channelRepository.updateChannel(channelId, {
                    isActive: false
                })
                channelExist= await channelRepository.getChannelById(channelId)

                // notify channel members
                socket.to(`channel-${channelId}`).emit("channel:deactive", {channel: channelExist})
                return response({
                    success: true,
                    message: "Channel deactivated successfully"
                })
            }
            await channelRepository.deleteChannel(channelId, fromUserId)

            response({
                success: true,
                message: "Channel deleted",
                data: {channel: channelExist}
            })
            
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}

export const removeGroupMembers= (io:Server, socket:Socket)=>{
    return async (payload: RemoveGroupMembers, response: ResponseFunc<{channel: Channel}>)=>{
        try {
            const {channelId,fromUserId,members}=payload
            let channelExist= await channelRepository.getChannelById(channelId)
            if(!channelExist){
                return response({
                    success: false,
                    message: "Channel does not exist"
                })
            }

            if(fromUserId!== channelExist.createdBy){
                return  response({
                    success: false,
                    message: "You are not authorize"
                })
            }

            await channelRepository.removeChannelMember(channelId, members)
            // notify members left
            socket.broadcast.to(`channel-${channelId}`).except(members.map((member)=> `channel-${member}`)).emit("channel:remove:members", {channel: channelExist})
            
            // notify members removed 
            members.forEach((userId)=>{
                socket.to(`channel-${userId}`).emit("group:removed", {channel: channelExist})
            })

            const message=(members.length)+ " " + (members.length>2? "members": "member") +" added"

            // remove socket

            response({
                success: true,
                message,
                data: {
                    channel: channelExist
                }
            })
        } catch (error) {
            response({
                success: false,
                message: "Something went wrong"
            })
        }
    }
}


export const removeGroupMembership= (io:Server, socket: Socket)=>{
    return async (payload: {fromUserId: string, channelId: string, targetUserId: string}, response: ResponseFunc<{channel: Channel}>)=>{
        const {channelId, fromUserId, targetUserId}= payload
        let channelExist= await channelRepository.getChannelById(channelId)
        if(!channelExist){
            return response({
                success: false,
                message: "Channel does not exist"
            })
        }

        if(channelExist.createdBy!==fromUserId && targetUserId!==fromUserId){
            // not group admin nor from actual user
            return response({
                success: false,
                message: "You are not authorize"
            })
        }

        await channelRepository.removeChannelMember(channelId, [targetUserId])
        channelExist= await channelRepository.getChannelById(channelId)
        if(targetUserId=== fromUserId){
            socket.broadcast.to(`channel-${channelId}`).emit("channel:remove:self", {channel:channelExist})
            return response({
                success: true,
                data: {
                    channel: channelExist
                }
            })
        }
        
        if(channelExist.createdBy=== fromUserId){
            socket.broadcast.to(`channel-${channelId}`).except(`channel-${targetUserId}`).emit("channel:remove:members", {channel: channelExist})
            return response({
                success: true,
                data: {
                    channel: channelExist
                }
            })
        }
    }
}

