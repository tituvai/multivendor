const express=require("express")
const router=express.Router()
const apiRouter=require('./api/index')

router.use(express.json())

router.use('/api/v1', apiRouter)



module.exports=router