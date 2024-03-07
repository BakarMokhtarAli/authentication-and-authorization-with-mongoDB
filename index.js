const app = require('./app');


const port = 8000;

app.listen(port,()=>{
    console.log(`app running on port ${port}`);
})

process.on('uncaughtException',err=>{
    console.log(`UNCAUGHTT EXCEPTION Shutting down...!`);
    console.log(err.name,err.message);
    // app.close(()=>{
    //     process.exit(1);
    // })
});

process.on("unhandledRejection",err => {
    console.log('UNHADLED REJECTION! Shutting down...!');
    console.log(err.name,err.message);
})