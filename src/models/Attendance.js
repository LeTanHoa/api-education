import mongoose from 'mongoose';

const schema=new mongoose.Schema({student:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},dateKey:{type:String,required:true},checkedInAt:{type:Date,default:Date.now}},{timestamps:true});
schema.index({student:1,dateKey:1},{unique:true});
export default mongoose.model('Attendance',schema);
