import { User } from "@prisma/client"
import { Request } from "express"
import { Jwt, JwtPayload } from "jsonwebtoken"
import { Socket } from "socket.io"
// scoket payload
export interface SendMessage {
    fromUserId: string
    channelId: string
    content: string
}

export interface ReadMessage {
    fromUserId: string
    fromChannel: string,
    messages: string[]
}

export interface DeleteMessage {
    fromUserId: string
    fromChannel: string,
    messages: string[]
}


export interface GetMessage{
    fromUserId: string,
    fromChannel: string,
    page: number,
    size: number
    readStatus?: boolean
}

export interface CreateChannel{
    fromUserId: string,
    name: string,
}

export interface DeactivateChannel{
    fromUserId: string,
    channelId: string
}

export interface UpdateChannel{
    fromUserId: string,
    channelId: string,
    name: string,
    active: boolean
}

export interface DeleteChannel{
    fromUserId: string,
    channelId: string,
}
export interface AddChannelMembers{
    fromUserId: string,
    channelId: string,
    members: string[]
}

export interface RemoveGroupMembers {
    fromUserId: string,
    channelId: string,
    members: string[]
}

export interface Updateuser{
    fromUserId: string,
    name: string
}
export type ResponseFunc<T>= (data:ResponseData<T>)=>void

export interface ResponseData<T> {
    success: boolean,
    message?: string,
    data?: T
}


export interface ICreateMessage{
    fromUserId: string,
    content: string,
    channelId: string,
    channelMembers: User[]
}

export interface Pagination{
    hasPrev: boolean,
    hasNext: boolean,
    totalItem: number,
    currentPage: number,
    size: number
}


// prisma

export interface ICreateChannel{
    name: string,
    userId: string,
    type: "GROUP" | "ONE_TO_ONE",
}

export interface IAddChannelmember{
    channelId: string,
    members: string[]
}

export interface IUpdateChannel {
    name?: string,
    isActive?: boolean
}


export interface IGetChannelMessage{
    fromUserId: string, 
    channelId: string,
    readStatus?: boolean, 
    take: number, 
    skip:number
}
export interface SocketExtension extends Socket{
    user: UserInfo
}

export interface RequestionExtension extends Request{
    user: UserInfo
}

export interface UserInfo{
    userId: string,
    email: string
}

export interface GetMessageQuery {
    size?: number,
    page?: number,
    readStaus: boolean,

}