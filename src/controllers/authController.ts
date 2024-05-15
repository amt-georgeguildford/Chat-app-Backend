import { Request, Response } from "express";
import prisma from "../config/prismaConfig";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { generateToken } from "../helpers/jwtService";
export const login= async(req: Request, res: Response)=>{
    try {
        const {email, password}= req.body

        const userExist= await prisma.user.findFirst({
            where: {
                email
            }
        })
        if(!userExist){
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            })
        }

        const isPasswordValid= bcrypt.compareSync(password,userExist.password)
        if(!isPasswordValid){
            return res.status(400).json({
                success: false,
                message: "password does not match"
            })
        }
        const payload= {
            userId: userExist.id,
            email: userExist.email
        }
        const accessToken= generateToken(payload)
        res.status(201).json({
            success: true,
            data: {
                user: payload,
                token: accessToken
            }
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


export const register= async (req: Request, res:Response)=>{
    try {
        const {email, password, name}= req.body

        const userExist= await prisma.user.findFirst({
            where: {
                email
            }
        })

        if(userExist){
            return res.status(400).json({
                success: false,
                message: "User already exist"
            })
        }

        const hashedPassword= bcrypt.hashSync(password,10)
        const createuser= await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            }
        })

        const userChannel= await prisma.channel.create({
            data:{
                id: createuser.id,
                createdBy: createuser.id,
                isActive: true,
                name,
                type: "ONE_TO_ONE",
                members: {
                    connect: {
                        id: createuser.id
                    }
                }
            }
        })
        res.status(201).json({
            success: true,
            data: {
                user: createuser
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}