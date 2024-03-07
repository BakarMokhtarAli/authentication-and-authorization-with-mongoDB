const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.PASSWORD);

module.exports = mongoose.connect(DB).then(()=>{
    console.log(`Databse Connected success!`);
}).catch(err=>{
    console.log(`Error connecting Database -> ${err}`);
})