import {PORT, DB_USERNAME, DB_PASSWORD} from './enviroment.js'

import express from 'express'
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

import appointmentRouter from './routes/appointment.js'

import cors from 'cors'


// Database connection
    //credentials for testing purposes:  'appointments-admin-1' / 'appointments-admin-secret-password'
    mongoose.connect(
        `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@appointments-project-db.thghcm5.mongodb.net/?retryWrites=true&w=majority&appName=appointments-project-db`
        ,{
            dbName: 'appointments-db'
        }
    )



// ExpressJs Implementation
    const app = express()

    app.use( bodyParser.urlencoded( {extended:true} ) )
    app.use(express.json())
    app.use(cors({origin: 'https://appointments-project-frontend.vercel.app/'}))
    app.use('/appointments', appointmentRouter)

    app.get('/', (req, res)=>{
        res.send(mhtml)
    })


// Start server, listening at {PORT}
    try {
        app.listen(PORT)
        console.log('\n\n🌱  ☀️  🌿  🪴  🌻  🏠')
        console.log("\n✅ Server \x1b[32mlistening\x1b[0m at port:", PORT,'\n')    
    } catch (error) {
        console.error('\n🔴 \x1b[31mERROR:\x1b[0m Something went wrong when \x1b[33mtrying to listen\x1b[0m at port:', PORT)
        console.error(`   ${error.name}: ${error.message}`)
        console.error('   \x1b[30m[sv.js] @ line 14\x1b[0m\n')
    }


    let mhtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form</title>
    </head>
    <body>
        <h1>Contact Form</h1>
        <form action="/appointments/create" method="POST">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required><br>
    
            <label for="phone">Phone:</label>
            <input type="tel" id="phone" name="phone" pattern="[0-9]{10}" placeholder="1234567890" required><br>
    
            <label for="mail">Email:</label>
            <input type="email" id="mail" name="mail" required><br>
    
            <input type="submit" value="Submit">
        </form>
    </body>
    </html>
    ` 