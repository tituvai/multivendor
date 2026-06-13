const express=require("express")
const router=express.Router()
const authRouter=require('./auth')
const categoryRouter=require('./category')
const productRouter=require('./product')
const orderRouter=require('./order')

router.use('/auth', authRouter)
router.use('/categories', categoryRouter)
router.use('/products', productRouter)
router.use('/orders', orderRouter)




module.exports=router