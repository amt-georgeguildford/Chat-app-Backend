import prisma from "../config/prismaConfig"

export const getUserInfo= (userId:string)=>{
    return prisma.user.findFirst({
        where: {
            id: userId
        },
        include: {
            channels: true
        }
    })
}

