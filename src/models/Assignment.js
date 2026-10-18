import mongoose from'mongoose';
export default mongoose.model('Assignment',new mongoose.Schema({lesson:{type:mongoose.Schema.Types.ObjectId,ref:'Lesson',required:true},teacher:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},students:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],dueDate:Date,status:{type:String,enum:['active','closed'],default:'active'}},{timestamps:true}));
