import 'dotenv/config';
import mongoose from 'mongoose';
import connectDb from './config/db.js';
import User from './models/User.js';
import Lesson from './models/Lesson.js';
import Question from './models/Question.js';
import Assignment from './models/Assignment.js';
import Progress from './models/Progress.js';
import Subject from './models/Subject.js';
import { DEFAULT_SUBJECTS } from './routes/subjects.routes.js';

const accounts=[
  {name:'Học sinh Minh Anh',email:'st@gmail.com',password:'123123',role:'student',grade:'2'},
  {name:'Quản trị viên',email:'ad@gmail.com',password:'123123',role:'admin'},
  {name:'Cô Thu Hà',email:'teacher@gmail.com',password:'123123',role:'teacher',teacherClasses:['2A']}
];

const lessons=[
  {title:'Phép cộng trong phạm vi 20',subject:'math',grade:2,description:'Luyện cộng các số tự nhiên trong phạm vi 20.',order:1,status:'published',publishedAt:new Date()},
  {title:'Phép trừ trong phạm vi 20',subject:'math',grade:2,description:'Làm quen với phép trừ và bài toán có lời văn.',order:2,status:'published',publishedAt:new Date()},
  {title:'So sánh các số',subject:'math',grade:2,description:'So sánh số lớn hơn, nhỏ hơn và bằng nhau.',order:3,status:'published',publishedAt:new Date()},
  {title:'Đọc hiểu: Chú mèo con',subject:'vietnamese',grade:2,description:'Đọc truyện ngắn và trả lời câu hỏi.',order:4,status:'published',publishedAt:new Date()},
  {title:'Từ và câu',subject:'vietnamese',grade:2,description:'Nhận biết từ chỉ sự vật và hoạt động.',order:5,status:'draft'}
];

const courseSamples=[
  {title:'Làm quen với các số đến 10',subject:'math',grade:1,description:'Đếm, so sánh và sắp xếp các số trong phạm vi 10.',questions:[
    {content:'Có 3 quả táo, thêm 2 quả táo. Có tất cả bao nhiêu quả?',type:'multiple_choice',options:['4','5','6'],answer:'5'},
    {content:'Điền số còn thiếu: 1, 2, __, 4',type:'fill_blank',answer:'3'},
    {content:'Sắp xếp các số từ bé đến lớn: 3, 1, 2',type:'drag_drop',options:['3','1','2'],answer:['1','2','3']}
  ]},
  {title:'Vần và tiếng đầu tiên',subject:'vietnamese',grade:1,description:'Nhận biết âm, vần và ghép tiếng đơn giản.',questions:[
    {content:'Tiếng nào bắt đầu bằng âm b?',type:'multiple_choice',options:['bé','cá','mẹ'],answer:'bé'},
    {content:'Điền chữ còn thiếu để được từ “cá”: __á',type:'fill_blank',answer:'c'},
    {content:'Tiếng kêu của con mèo là gì?',type:'multiple_choice',options:['meo meo','gâu gâu','cạc cạc'],answer:'meo meo'}
  ]},
  {title:'Cộng trừ trong phạm vi 100',subject:'math',grade:2,description:'Luyện tính nhẩm phép cộng và phép trừ hai chữ số.',questions:[
    {content:'36 + 12 bằng bao nhiêu?',type:'multiple_choice',options:['46','48','52'],answer:'48'},
    {content:'Điền số còn thiếu: 50 - __ = 35',type:'fill_blank',answer:'15'},
    {content:'Xếp các bước tính theo thứ tự từ hàng đơn vị đến hàng chục.',type:'drag_drop',options:['Cộng hàng chục','Cộng hàng đơn vị'],answer:['Cộng hàng đơn vị','Cộng hàng chục']}
  ]},
  {title:'Đọc hiểu và từ chỉ hoạt động',subject:'vietnamese',grade:2,description:'Đọc câu ngắn, tìm ý và nhận biết từ chỉ hoạt động.',questions:[
    {content:'Trong câu “Lan tưới cây”, ai đang tưới cây?',type:'multiple_choice',options:['Lan','Cây','Bạn Nam'],answer:'Lan'},
    {content:'Từ nào trong câu “Bé chạy nhanh” chỉ hoạt động?',type:'fill_blank',answer:'chạy'},
    {content:'Con vật nào sống dưới nước?',type:'multiple_choice',options:['cá','chim','mèo'],answer:'cá'}
  ]},
  {title:'Bảng nhân và chia cơ bản',subject:'math',grade:3,description:'Củng cố phép nhân, phép chia và nhận biết quy luật.',questions:[
    {content:'6 × 4 bằng bao nhiêu?',type:'multiple_choice',options:['20','24','28'],answer:'24'},
    {content:'Điền số còn thiếu: 35 : 5 = __',type:'fill_blank',answer:'7'},
    {content:'Sắp xếp các tích theo thứ tự tăng dần: 3×2, 2×5, 4×3.',type:'drag_drop',options:['3×2','2×5','4×3'],answer:['3×2','2×5','4×3']}
  ]},
  {title:'Từ loại và câu kể',subject:'vietnamese',grade:3,description:'Phân biệt từ chỉ sự vật, hoạt động và câu kể.',questions:[
    {content:'Từ nào là từ chỉ đặc điểm?',type:'multiple_choice',options:['xanh','chạy','học sinh'],answer:'xanh'},
    {content:'Điền dấu câu thích hợp: “Hôm nay em đi học__”',type:'fill_blank',answer:'.'},
    {content:'Từ nào là từ chỉ sự vật?',type:'multiple_choice',options:['hoa','chạy','nhanh'],answer:'hoa'}
  ]},
  {title:'Phân số và phép tính',subject:'math',grade:4,description:'Nhận biết phân số bằng nhau và thực hiện phép tính đơn giản.',questions:[
    {content:'Phân số nào bằng 1/2?',type:'multiple_choice',options:['2/4','2/3','3/5'],answer:'2/4'},
    {content:'Điền kết quả: 3/8 + 2/8 = __/8',type:'fill_blank',answer:'5'},
    {content:'Sắp xếp phân số từ bé đến lớn: 1/4, 3/4, 2/4.',type:'drag_drop',options:['1/4','3/4','2/4'],answer:['1/4','2/4','3/4']}
  ]},
  {title:'Đọc hiểu và trạng ngữ',subject:'vietnamese',grade:4,description:'Tìm ý chính và nhận biết bộ phận bổ sung thời gian, nơi chốn.',questions:[
    {content:'Trong câu “Sáng nay, chúng em trồng cây”, trạng ngữ chỉ điều gì?',type:'multiple_choice',options:['Thời gian','Nơi chốn','Nguyên nhân'],answer:'Thời gian'},
    {content:'Điền từ còn thiếu: Ý chính là nội dung __ của đoạn văn.',type:'fill_blank',answer:'quan trọng nhất'},
    {content:'Từ nào cùng nghĩa với “dũng cảm”?',type:'multiple_choice',options:['gan dạ','nhút nhát','chậm chạp'],answer:'gan dạ'}
  ]},
  {title:'Số thập phân và đo lường',subject:'math',grade:5,description:'Đọc số thập phân, đổi đơn vị và giải toán thực tế.',questions:[
    {content:'Số thập phân 3,25 có chữ số hàng phần mười là số nào?',type:'multiple_choice',options:['2','5','3'],answer:'2'},
    {content:'2,5 m bằng __ cm.',type:'fill_blank',answer:'250'},
    {content:'Sắp xếp số thập phân từ bé đến lớn: 1,2; 0,8; 1,05.',type:'drag_drop',options:['1,2','0,8','1,05'],answer:['0,8','1,05','1,2']}
  ]},
  {title:'Đọc hiểu và viết đoạn văn',subject:'vietnamese',grade:5,description:'Xác định ý chính, từ nối và cách sắp xếp ý trong đoạn văn.',questions:[
    {content:'Từ nối nào thường dùng để nêu kết quả?',type:'multiple_choice',options:['Vì vậy','Mặc dù','Trong khi'],answer:'Vì vậy'},
    {content:'Điền từ thích hợp: Câu chủ đề thường nêu __ chính của đoạn.',type:'fill_blank',answer:'ý'},
    {content:'Sắp xếp các phần của đoạn văn theo thứ tự hợp lý.',type:'drag_drop',options:['Câu kết','Câu mở đoạn','Các câu triển khai'],answer:['Câu mở đoạn','Các câu triển khai','Câu kết']}
  ]}
];

const questions=[
  {content:'12 + 7 bằng bao nhiêu?',subject:'math',grade:2,difficulty:'easy',type:'multiple_choice',options:['17','18','19','20'],answer:'19'},
  {content:'20 - 8 bằng bao nhiêu?',subject:'math',grade:2,difficulty:'easy',type:'multiple_choice',options:['10','11','12','13'],answer:'12'},
  {content:'Điền số thích hợp: 15 > __',subject:'math',grade:2,difficulty:'medium',type:'fill_blank',options:[],answer:'14'},
  {content:'Chọn dấu đúng: 9 __ 9',subject:'math',grade:2,difficulty:'easy',type:'multiple_choice',options:['>','<','='],answer:'='},
  {content:'Nhân vật chính trong bài Chú mèo con là ai?',subject:'vietnamese',grade:2,difficulty:'easy',type:'multiple_choice',options:['Chú chó','Chú mèo','Chú thỏ','Chú chim'],answer:'Chú mèo'},
  {content:'Từ nào chỉ hoạt động?',subject:'vietnamese',grade:2,difficulty:'medium',type:'multiple_choice',options:['Cây bút','Chạy nhảy','Sân trường','Quyển vở'],answer:'Chạy nhảy'}
];

try{
  await connectDb();
  for (const s of DEFAULT_SUBJECTS) {
    await Subject.findOneAndUpdate({ key: s.key }, s, { upsert: true, new: true, setDefaultsOnInsert: true });
  }
  await Question.deleteMany({type:'matching'});
  const users={};
  for(const account of accounts){
    let user=await User.findOne({email:account.email}).select('+password');
    if(user){Object.assign(user,account);await user.save()}else user=await User.create(account);
    users[account.role]=user;
  }
  const savedLessons=[];
  for(const lesson of lessons){
    savedLessons.push(await Lesson.findOneAndUpdate({title:lesson.title,createdBy:users.teacher._id},{...lesson,createdBy:users.teacher._id},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}));
  }
  const savedSampleLessons=[];
  for(const [index,lesson] of courseSamples.entries()){
    const saved=await Lesson.findOneAndUpdate({title:lesson.title,createdBy:users.teacher._id},{title:lesson.title,subject:lesson.subject,grade:lesson.grade,description:lesson.description,order:index+1,status:'published',publishedAt:new Date(),createdBy:users.teacher._id},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});
    savedSampleLessons.push(saved);
    for(const question of lesson.questions){
      await Question.findOneAndUpdate({lesson:saved._id,content:question.content,createdBy:users.teacher._id},{...question,lesson:saved._id,subject:lesson.subject,grade:lesson.grade,difficulty:'easy',status:'published',createdBy:users.teacher._id},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});
    }
  }
  const savedQuestions=[];
  for(const question of questions){
    const lesson=question.subject==='math'?savedLessons[0]:savedLessons[3];
    savedQuestions.push(await Question.findOneAndUpdate({content:question.content,createdBy:users.teacher._id},{...question,lesson:lesson._id,status:'published',createdBy:users.teacher._id},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}));
  }
  const assignments=[
    {lesson:savedLessons[0]._id,teacher:users.teacher._id,students:[users.student._id],dueDate:new Date('2026-10-15'),status:'active'},
    {lesson:savedLessons[1]._id,teacher:users.teacher._id,students:[users.student._id],dueDate:new Date('2026-10-18'),status:'active'},
    {lesson:savedLessons[3]._id,teacher:users.teacher._id,students:[users.student._id],dueDate:new Date('2026-10-20'),status:'closed'}
  ];
  for(const assignment of assignments){
    await Assignment.findOneAndUpdate({lesson:assignment.lesson,teacher:assignment.teacher},{...assignment},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});
  }
  const progress=[
    {lesson:savedLessons[0]._id,score:95,completedAt:new Date('2026-10-08'),timeSpent:25,answers:[{question:savedQuestions[0]._id,correct:true},{question:savedQuestions[1]._id,correct:true}]},
    {lesson:savedLessons[1]._id,score:80,completedAt:new Date('2026-10-09'),timeSpent:30,answers:[{question:savedQuestions[1]._id,correct:true},{question:savedQuestions[2]._id,correct:false}]},
    {lesson:savedLessons[2]._id,score:100,completedAt:new Date('2026-10-10'),timeSpent:18,answers:[{question:savedQuestions[3]._id,correct:true}]},
    {lesson:savedLessons[3]._id,score:90,completedAt:new Date('2026-10-10'),timeSpent:22,answers:[{question:savedQuestions[4]._id,correct:true},{question:savedQuestions[5]._id,correct:true}]}
  ];
  for(const item of progress){
    await Progress.findOneAndUpdate({student:users.student._id,lesson:item.lesson},{...item,student:users.student._id},{new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});
  }
  console.log(`Seeded ${savedLessons.length+savedSampleLessons.length} lessons (${savedSampleLessons.length} extra courses for grades 1-5), ${savedQuestions.length+courseSamples.reduce((sum,lesson)=>sum+lesson.questions.length,0)} questions, ${assignments.length} assignments and ${progress.length} progress records.`);
}catch(error){console.error('Unable to seed demo data:',error.message);process.exitCode=1}finally{await mongoose.disconnect()}
