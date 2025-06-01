import User from "../models/userModel";

export const register = async (req, res) => {
    try {
        const {username, email, password} = req.body;
        const existingUser = await User.findOne({email});
        if (existingUser) {
            return res.status(400).json({success : false, error : 'User already Exists'});
        }
        const newUser = await User.create({username, email, password});
    } catch (error) {
        
    }
}