const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const bodyParser=require("body-parser")

const mongoose = require('mongoose');
const { type, send } = require('express/lib/response')
mongoose.connect(process.env.MONGO_URI).then(data=>{
  console.log("Conexion establecida")
})

const userSchema=mongoose.Schema({
  username : String,
})

const exerciseSchema=mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
  description: String,
  duration: Number,
  date: String,
})

const logSchema=mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
  count:Number,
  log:[{
    type:mongoose.Schema.Types.ObjectId, ref:"Exercise"
  }]
})

const User=mongoose.model("User",userSchema)

const Exercise=mongoose.model("Exercise",exerciseSchema)


app.use(bodyParser.urlencoded({extended:false}))

//*Usuarios
app.route("/api/users").post((req,res)=>{
  const newUser=new User({username:req.body.username})

  newUser.save().then(data=>{
    res.json(data)
  })
})
.get((req,res)=>{
  User.find().then(data=>{
    res.json(data)
  })
})

//*Ejercicios
app.route("/api/users/:_id/exercises").post((req,res)=>{
  const userId=req.params._id

  const {description,duration,date}=req.body

  if(date=="" || date==null || new Date(date).toDateString() === "Invalid Date"){
    var formatDate=new Date().toDateString()
  }else{
    var formatDate=new Date(date).toDateString()
  }

  User.findById(userId).then(data=>{
    if(data==null){
      console.log("Error: Usuario no encontrado")
    }else{
      const newExercise=new Exercise({userId:userId,description:description,duration:Number(duration),date:formatDate})

      newExercise.save().then((data)=>{
        Exercise.findById(data._id).populate('userId').then(exercise=>{
          const exerciseObj={
              username: exercise.userId.username,
              description: exercise.description,
              duration: exercise.duration,
              date: exercise.date,
              _id: exercise.userId._id
            
          }
          res.json(exerciseObj)
        })
       
      })
    }
  })

  
})


app.get("/api/users/:_id/logs",(req,res)=>{
const userId=req.params._id



  User.findById(userId).then((user)=>{
    if(user){
      const {from,to,limit}=req.query

      if(from==undefined && to==undefined && limit==undefined){
        Exercise.find({userId:userId}).select({userId:0,_Id:0,__v:0}).then(exercises=>{
          logObj={
            username: user.username,
            count: exercises.length,
            _id: user._id,
            log: exercises
          }
      
          res.json(logObj)
        })
      }else {
        console.log({from,to,limit})
        if(limit){
          Exercise.find({userId:userId}).select({userId:0,_Id:0,__v:0}).limit(limit).then(exercises=>{
          
            logObj={
              username: user.username,
              count: exercises.length,
              _id: user._id,
              log: exercises
            }
        
            res.json(logObj)
          })
        }else{
          Exercise.find({userId:userId}).select({userId:0,_Id:0,__v:0}).then(exercises=>{
          
            const exercisesInDate=exercises.filter(exer=>{
              console.log(new Date(exer.date).getTime()>=new Date(from).getTime() && new Date(exer.date).getTime()<=new Date(to).getTime())
              return new Date(exer.date).getTime()>=new Date(from).getTime() && new Date(exer.date).getTime()<=new Date(to).getTime()
            })
            
            logObj={
              username: user.username,
              count: exercises.length,
              _id: user._id,
              log: exercisesInDate
            }
            console.log(logObj)
            res.json(logObj)
          })
        }
        
      }
      
    }
  })

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
