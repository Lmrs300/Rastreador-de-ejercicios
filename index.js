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
    console.log("Usuario agregado")
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

  let {description,duration,date}=req.body

  if(date==""){
    date=new Date().toDateString()
  }else{
    date=new Date(date).toDateString()
  }

  User.findById(userId).then(data=>{
    if(data==null){
      console.log("Error: Usuario no encontrado")
    }else{
      const newExercise=new Exercise({userId:userId,description:description,duration:Number(duration),date:date})

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

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
