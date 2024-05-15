import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../helpers/jwtService";
import { RequestionExtension, UserInfo } from "../type";

export const authenticate=(req: RequestionExtension, res:Response, next:NextFunction)=>{
    try {
        const {authorization}= req.headers
        if(!authorization){
            throw new Error("Missing token")
        }
        const token = authorization.split(" ")[1]
        if(!token){
            throw new Error("Missing token")
        }
        const payload= verifyToken(token) as UserInfo
        if(!payload){
            throw new Error("Invalid token")
        }

        req.user= payload
        next()
    } catch (error) {
        console.log(error)
        next(error)
    }
}