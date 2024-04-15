import mongoose from "mongoose";


const appointmentSchema = new mongoose.Schema({
    date: String, // Date in format: "${month_name}_${date}_${year}" | e.g: March 15 2020 => "Mar_15_2020" 
    hour: String, // Hour in format: "${hour}_${minute}" | e.g: 20:15:51 => "20_15"
    hour_ms: Number,
    
    name: String,
    dni: Number,  // dni without the points
    phone: Number,
    email: String,
    
})


export default mongoose.model('Appointment', appointmentSchema, 'appointments')