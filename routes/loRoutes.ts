import express from 'express'

const router=express.Router();

const LoController=require('../controllers/LoController')

router.post("/addnewlo",LoController.addNewLo);

module.exports=router;