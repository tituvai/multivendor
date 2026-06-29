const express=require("express")
const router=express.Router()
const authRouter=require('./auth')
const categoryRouter=require('./category')
const productRouter=require('./product')
const orderRouter=require('./order')
const vendorRouter=require('./vendor')
const usersRouter=require('./users')
const uploadRouter=require('./upload')
const flashSaleRouter=require('./flashSale')
const bannerRouter=require('./banner')

router.use('/auth', authRouter)
router.use('/categories', categoryRouter)
router.use('/products', productRouter)
router.use('/orders', orderRouter)
router.use('/vendors', vendorRouter)
router.use('/users', usersRouter)
router.use('/upload', uploadRouter)
router.use('/flash-sales', flashSaleRouter)
router.use('/banners', bannerRouter)




module.exports=router