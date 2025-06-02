import jwt from 'jsonwebtoken';
import User from "../models/userModel";

export const register = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({
                success : false, 
                error : 'User already Exists'
            });
        }
        const newUser = await User.create({username, email, password});
        const payload = {
            id : newUser._id,
            role : newUser.role
        }

        //Creating a signed  token with token expiration
        const token = jwt.sign(
            payload,
            process.env.SECRET_ACCESS_TOKEN,
            {expiresIn : "15m"}
        );

        const userResponse = {
            _id : newUser._id,
            username : newUser.username,
            email : newUser.email,
            role : newUser.role,
            createdAt : newUser.createdAt
        }

        //Response Body
        res
            .status(201)
            .cookie('access_token', token, {
                httpOnly: true,
                secure : process.env.NODE_ENV === 'production',
                sameSite : 'strict',
                maxAge : 15 * 60 * 1000
            })
            .json({
                success : true,
                data : userResponse,
                message : 'Registraion Successful'
            });

    } catch (error) {
        res.status(500).json({success : false, error : error.message});
    }
};
