import {Router} from 'express';
import Attendance from '../models/Attendance.js';
import {authenticate,allowRoles} from '../middlewares/auth.js';

const router=Router();
router.use(authenticate,allowRoles('student'));
const todayKey=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dayBefore=key=>{const date=new Date(`${key}T00:00:00+07:00`);date.setDate(date.getDate()-1);return todayKeyFromDate(date)};
const todayKeyFromDate=date=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
router.get('/me',async(req,res,next)=>{try{const records=await Attendance.find({student:req.user.id}).sort({dateKey:-1}).limit(60).lean();const dates=new Set(records.map(x=>x.dateKey));let streak=0,key=todayKey();if(!dates.has(key))key=dayBefore(key);while(dates.has(key)){streak++;key=dayBefore(key)}res.json({records,checkedInToday:dates.has(todayKey()),streak,totalDays:await Attendance.countDocuments({student:req.user.id}),baseXP:req.user.baseXP||0,baseCoins:req.user.baseCoins||0})}catch(error){next(error)}});
router.post('/check-in',async(req,res,next)=>{try{const dateKey=todayKey(),existing=await Attendance.findOne({student:req.user.id,dateKey});if(existing)return res.json({record:existing,alreadyCheckedIn:true});const record=await Attendance.create({student:req.user.id,dateKey});res.status(201).json({record,alreadyCheckedIn:false})}catch(error){if(error.code===11000)return res.json({alreadyCheckedIn:true});next(error)}});
export default router;
