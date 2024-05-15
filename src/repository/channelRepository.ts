import prisma from "../config/prismaConfig"
import { IAddChannelmember, ICreateChannel, IUpdateChannel } from "../type"

export const getAllChannel=(userId: string)=>{
    return prisma.channel.findMany({
        where: {
            isActive: false,
            members: {
                some:{
                    id: userId
                }
            }
        }
    })
}

export const getUserChannels= (userId: string)=>{
    return prisma.user.findFirst({
        where: {
            id: userId
        },
        include: {
            channels: true
        }
    })
}
export const getChannelById= async(channelId: string)=>{
    return prisma.channel.findFirst({
        where: {
            id:channelId
        },
        include: {
            members: true
        }
    })
}

export const createChannel= async (data: ICreateChannel)=>{
    const {name,type, userId}= data
    return prisma.channel.create({
        data:{
            name,
            isActive: true,
            createdBy: userId,
            type,
            members:{
                connect:{
                    id: userId
                }
            }
        }
    })
}

export const addChannelUsers= async (data: IAddChannelmember)=>{
    const {channelId, members}= data
    return prisma.channel.update({
        where: {
            id: channelId
        },
        data: {
            members: {
                connect: members.map((member)=>({id: member}))
            }
        }
    })
}

export const updateChannel= async (channelId: string, data: IUpdateChannel)=>{
    return prisma.channel.update({
        where: {
            id: channelId
        },
        data: data,
        include:{
            members: true
        }
    })
}

export const deleteChannel= async(channelId: string, userId: string)=>{
    return prisma.channel.update({
        where:{
            id: channelId
        },
        data: {
            members: {
                disconnect: {
                    id: userId
                }
            }
        }
    })
}

export const removeChannelMember= async(channelId: string, members: string[])=>{
    return prisma.channel.update({
        where: {
            id: channelId
        },
        data: {
            members:{
                disconnect:members.map((member)=>({
                    id: member
                }))
            }
        }
    })
}

export const getChannelMembersExcept= async(channelId: string, membersException: string[])=>{
    return prisma.channel.findFirst({
        where: {
            id: channelId,
        },
        include: {
            members: {
                where: {
                    id:{
                        notIn: membersException
                    }
                }
            }
        }
    })
}