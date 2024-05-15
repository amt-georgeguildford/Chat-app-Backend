import { Prisma } from "@prisma/client"
import prisma from "../config/prismaConfig"
import { ICreateMessage, IGetChannelMessage } from "../type"



export const createOneOnOneMessage= async(createMessage: ICreateMessage)=>{
    const {fromUserId, channelId,content,channelMembers}= createMessage
    return prisma.$transaction(async(tsx)=>{
        
        // ad sender channel to recipient
        await tsx.user.update({
            where: {
                id: fromUserId,
                // channels: {
                //     every:{
                //         id: {
                //             not: channelId
                //         }
                //     }
                // }
            },
            data:{
                channels: {
                    connect:{
                        id: channelId
                    }
                }
            }
        })

        // add recipient channel to sender
        await tsx.user.update({
            where: {
                id: channelId,
                // channels: {
                //     every:{
                //         id: {
                //             not:fromUserId
                //         }
                //     }
                // }
            },
            data: {
                channels: {
                    connect: {
                        id: fromUserId
                    }
                }
            }
        })

        return tsx.message.create({
            data: {
                content,
                channels: {
                    connect: [
                        {
                            id: fromUserId
                        },
                        {
                            id: channelId
                        }
                    ]
                },
                sender: {
                    create: {
                        userId: fromUserId
                    }
                },
                recipients: {
                    createMany: {
                        data: channelMembers.map((members)=>({
                            userId: members.id
                        } satisfies Prisma.RecipientCreateManyMessageInput))
                    }
                }
            }
        })
    })

}

export const markMessageAsread= async (recipientId: string, messages: string[], )=>{
    await prisma.message.updateMany({
        where: {
           id: {
            in: messages
           }
        },
        data: {
            receipt: "READ",
            
        }
    })
    await prisma.recipient.updateMany({
        where: {
            userId: recipientId,
            messageId: {
                in: messages,
                
            }
        },
        data: {
            isRead: true
        }
    })
}

export const deleteMessages= async (userId: string, channelId: string, messages: string[])=>{

    return prisma.$transaction(async(tsx)=>{
        // delete sent message
        await tsx.sender.updateMany({
            where:{
                message:{
                    id:{
                        in: messages,
                    },
                },
                userId
            },
            data: {
                isDeleted: true
            }
        })

        // delete received messages
        await tsx.recipient.updateMany({
            where: {
                message:{
                    id: {
                        in: messages
                    },
                },
                userId
            },
            data: {
                isDeleted: true
            }
        })
    })
}

export const getMessages= async (getCahnnelMessage: IGetChannelMessage)=>{
    const {channelId, fromUserId,skip,take,readStatus}= getCahnnelMessage
    const findMessages= prisma.message.findMany({
        where: {
            AND: [
                {
                    channels:{
                        some: {
                            id: channelId
                        }
                    },
                },
                {
                    OR: [
                        {
                            sender: {
                                userId: fromUserId,
                                isDeleted: false
                            },
                        },
                        {
                            recipients: {
                                some: {
                                    userId: fromUserId,
                                    isDeleted: false,
                                    isRead: readStatus
                                }
                            }
                        }
                    ]
                }
            ]
            
            
        },
        orderBy:{
            createAt: "desc"
        },
        take,
        skip
    })
    const messageCount= prisma.message.count({
        where: {
            channels:{
                some: {
                    id: channelId
                }
            }
        }
    })
    const [messages, count]= await prisma.$transaction([
        findMessages, messageCount 
    ])
    return {
        messages, totalItem: count
    }
}