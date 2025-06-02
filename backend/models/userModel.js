import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema(
    {
        username : {
            type  : String,
            required : [true, 'username is required'],
            unique : true,
            trim : true
        },
        email : {
            type : String,
            required :[true, 'Email is required'],
            unique : true,
            lowercase : true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
        },
        password : {
            type : String,
            required : [true, 'Password is required'],
            minlength  : [6, 'Password must be 6 characters long!'],
            select : false
        },
        role : {
            type : String,
            enum : ['user', 'admin'],
            default : 'user'
        },
    },
    {timestamps : true}
);

userSchema.pre('save', async function (next) {
    try {
        if (!this.isModified('password')) return next 
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(this.password, salt);
        this.password = hash;
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword){
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;