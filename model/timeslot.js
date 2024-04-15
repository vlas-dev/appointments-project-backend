import mongoose from "mongoose";
import {OPENING_TIME ,CLOSING_TIME ,OPENING_TIME_MS ,CLOSING_TIME_MS ,WORKING_TIME_MS ,TIMESLOT_LENGTH ,TIMESLOT_LENGTH_MS ,TIMESLOT_AMOUNT ,APPOINTMENTS_PER_TIMESLOT, TIMESLOT_STEP_MS} from '../enviroment.js'
import { fromMiliseconds } from "../utility.js";

const timeslotSchema = new mongoose.Schema({
    date: String, // Date in format: `${month_name} ${date}, ${year}`    | e.g: March/15/2020   =>  "March 15, 2020" 
    
    start_time: String,  // Hour in format: `${hour}:${minute}`          | e.g: 20:15:51        =>  "20:15"
    end_time: String,    // Hour in format: `${hour}:${minute}`          | e.g: 21:15:51        =>  "21:15"
    time_step: String,   // Minutes in format: `${hour}:${minute}`       | e.g: 00:15:00        =>  "00:15"
    
    start_ms: Number,    // Time in unix epoch miliseconds
    end_ms: Number,      // Time in unix epoch miliseconds
    step_ms: Number,     // Time in unix epoch miliseconds
    
    appointments: [{
        appointment: mongoose.SchemaTypes.ObjectId,
        available: Boolean,
        hour: String,
        hour_ms: Number,
        _id:false
    }], // Array of objects in format: {appointment:(obj_id/null||true/null)*, available: Bool, hour:String, hour_ms:Number}, *depending on credentials////[mongoose.SchemaTypes.ObjectId] // array of appointments documents _ids
    appointments_total: Number,
    appointments_available: Number,

    timeslot_index: Number,
})



// @param date: An already curated/validated/sanitized string Date in format: `${month_name} ${date}, ${year}` (e.g: "March 15, 2020")
// @param index: The index of the timeslot in the workday
timeslotSchema.statics.getDummyTimeslot = function (date, index){
    if(typeof date == 'undefined' || typeof index == "undefined"){
        throw new Error(`[model/timeslot.js] Missing date (${date}) or index (${index})`);
    }
    
    let Timeslot_Dummy = mongoose.model('Timeslot', timeslotSchema)
    

    let dummy = new Timeslot_Dummy({
        date: date, // SHOULD be an already curated/validated/sanitized string

        start_time: null,
        end_time:   null,
        time_step:  null,

        start_ms: OPENING_TIME_MS + TIMESLOT_LENGTH_MS*index, // 09:00am + 01:00*index
        end_ms:   OPENING_TIME_MS + TIMESLOT_LENGTH_MS*index + TIMESLOT_LENGTH_MS-60000, // start_ms + 00:59
        step_ms:  TIMESLOT_STEP_MS,

        appointments: [],
        appointments_total: APPOINTMENTS_PER_TIMESLOT,
        appointments_available: APPOINTMENTS_PER_TIMESLOT,

        timeslot_index: index,
        _id:null    
    })

    if(index+1 == TIMESLOT_AMOUNT) { dummy.end_ms = CLOSING_TIME_MS } // if there is time remaining after last timeslot, extend said slot to closing time
    dummy.start_time = fromMiliseconds(dummy.start_ms, 'hour_string')
    dummy.end_time   = fromMiliseconds(dummy.end_ms,   'hour_string')
    dummy.time_step  = fromMiliseconds(dummy.step_ms,  'hour_string')
    
    dummy.appointments = Array.from(
        { length: dummy.appointments_total },
        (_, index) => ({
            appointment: null, 
            available:   true, 
            hour: fromMiliseconds(dummy.start_ms + (dummy.step_ms * index)), 
            hour_ms: dummy.start_ms + (dummy.step_ms * index),
            appointment_index: index
        })
    );
    
    return dummy
}

// @param date: An already curated/validated/sanitized string Date in format: `${month_name} ${date}, ${year}` (e.g: "March 15, 2020")
timeslotSchema.statics.getEmptyTimeslotsArray = function (date, length=TIMESLOT_AMOUNT){
    if(typeof date == 'undefined'){
        throw new Error(`[model/timeslot.js] Missing date (${date})`);
    }

    let empty_timeslots_array = Array.from(
        { length: length },
        (_, index) => (timeslotSchema.statics.getDummyTimeslot(date, index))
    );
    
    return empty_timeslots_array
}

// @param timeslots_array: an array of timeslots obj retrieved from the DB
// This method redacts and transform data that is not meant to be public accessible
timeslotSchema.statics.sanitizeTimeslotArray = function(timeslots_array){
    //* Data to transform: _id, appointments
    timeslots_array.forEach(timeslot_obj => {
        timeslot_obj._id = null
        timeslot_obj.appointments.forEach(element =>{ 
            if( !element.available ){
                element.appointment = true
            }
        })
    });
}

timeslotSchema.statics.fillFoundTimeslotsArray = function(found_timeslots_array){
    if (found_timeslots_array.length == 0 ){return}

    let date = found_timeslots_array[0].date
    let empty_timeslots_array = timeslotSchema.statics.getEmptyTimeslotsArray(date)
    
    found_timeslots_array.forEach(element => {
        empty_timeslots_array[element.timeslot_index] = element
    });

    empty_timeslots_array.forEach((element,index )=>{
        found_timeslots_array[element.timeslot_index] = element
    })
}

export default mongoose.model('Timeslot', timeslotSchema, 'timeslots')



// let date = new Date('July 20')                 // => 2001-07-20T03:00:00.000Z
// date.toLocaleString('en', {month: 'short'} )  //  => 'Jul'
//
// const weekdayNames   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// const currentDayName = weekdayNames[new Date().getDay()]; //Date.getDay() returns a number from 0 to 6

// const str = '5';
// const paddedStr = str.padStart(2, '0');
// console.log(paddedStr); // Output: "05"
//
// The padStart() method is a built-in method available on string objects in JavaScript. It pads the
// current string with another string (repeated, if needed) so that the resulting string reaches a given
// length. If the string's length is already equal to or greater than the specified length, the string
// remains unchanged.