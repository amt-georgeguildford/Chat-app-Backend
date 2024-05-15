import jwt, { JsonWebTokenError,TokenExpiredError } from "jsonwebtoken"

export const generateToken= (payload: {userId: string, email: string} )=>{
    return jwt.sign(payload,process.env["JWT_SECRET"], {
        expiresIn: process.env["JWT_TTL"]
    })
}


export const verifyToken= (token: string)=>{
    try {
        
        return jwt.verify(token,process.env["JWT_SECRET"])
    } catch (error) {
        if(error instanceof TokenExpiredError){
            throw new Error("Session expired")
        }
        if(error instanceof JsonWebTokenError){
            throw new Error("Invalid token")
        }
    }
}