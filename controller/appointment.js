import express from 'express'
import { body, param, check, validationResult } from 'express-validator';

import Appointment from '../model/appointment.js';
import Timeslot from '../model/timeslot.js';
import { CLOSING_TIME_MS, OPENING_TIME_MS, TIMESLOT_AMOUNT } from '../enviroment.js';
import { fromMiliseconds, toMiliseconds } from '../utility.js';
import appointment from '../model/appointment.js';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const MONTHS_CONVERTER = {'jan':'january', 'feb':'february', 'mar':'march', 'apr':'april', 'may':'may', 'jun':'june', 'jul':'july', 'aug':'august', 'sep':'september', 'oct':'october', 'nov':'november', 'dec':'december'}


export const dateParamValidator = [
    param('month')
        .exists({ checkFalsy: true }).withMessage('Month not provided')
        .isString().withMessage('Month expected to be a String').bail()
        .custom(value => MONTHS.includes(value.toLowerCase())).withMessage('Month format invalid'),
    param('day')
        .exists({ checkFalsy: true }).withMessage('Day not provided')
        .isLength({ max: 2 }).withMessage('Day can have a maximun of 2 characters: 01 or 1')
        .isNumeric().withMessage('Day expected to be a Number')
        .isInt({ gt: 0, lt: 32 }).withMessage('Day must be a value between 1 and 31'),
    param('year')
        .exists({ checkFalsy: true }).withMessage('Year not provided')
        .isNumeric().withMessage('Year expected to be a Number')
        .isInt({ gt: 1999, lt: 2999 }).withMessage('Year must be a value in this millennium'),
]

export async function sendTimeslotsByDate(req, res) { 
    res.setHeader('Content-Type', 'application/json');
    console.log("Testeo linea 32" , opening_hour , closing_hour)
    // In case of params validation failure, send error and end response.
    let result = validationResult(req);
    if(!(result.isEmpty())){
        res.json({ error: true, msg: (result.array())[0].msg })
        return res.end() 
    }
    
    // Generate a valid Date string from the params, in the format the DB expects
    // `${month_name} ${date}, ${year}`  |  e.g: March/2/2020   =>  "march 0, 2020" 
    let month = (req.params.month).toLowerCase()
        month = month.length <= 3 ? MONTHS_CONVERTER[month] : month;
    let day   = Number(req.params.day)
    let year  = req.params.year || new Date().getFullYear()
    let valid_date_string = `${month} ${day<10?'0'+day : day}, ${year}`
    
    // Try to retrieve data from DB, if fail, send 500 error and and end response.
    // At success, send retrieved and sanitized data and end response.
    let found_timeslots_array = []
    try {
        found_timeslots_array = await Timeslot.find({ date: valid_date_string })
        Timeslot.sanitizeTimeslotArray(found_timeslots_array)
        
        let found_amount = found_timeslots_array.length
        if (found_amount == TIMESLOT_AMOUNT){
            res.json(found_timeslots_array)
            return res.end() 
        }

        if (found_amount == 0){
            res.json(Timeslot.getEmptyTimeslotsArray(valid_date_string))
            return res.end() 
        }

        await Timeslot.fillFoundTimeslotsArray(found_timeslots_array)
        res.json(found_timeslots_array)
        return res.end()
    } catch (error) {
        console.log('\nLog @ appointment controller .sendTimeslotsByDate()')
        console.error(error)
        res.status(500).json({ error: true, msg: 'Internal Server Error'})
        return res.end() 
    }
}


const opening_hour = fromMiliseconds(OPENING_TIME_MS,'hours'); // Change opening_hour to allow 9:00 appointments
const closing_hour = fromMiliseconds(CLOSING_TIME_MS,'hours')
export const hourParamValidator = [
    param('hour')
        .exists({ checkFalsy: true }).withMessage('Hour not provided')
        .isLength({ max: 2 }).withMessage('Hour can have a maximun of 2 characters: 01 or 1')
        .isNumeric().withMessage('Hour expected to be a Number').bail()
        .isInt({ gte: opening_hour, lt: closing_hour}).withMessage(`Hour must be a value between ${opening_hour} and ${closing_hour}`),
        // .isInt({ gt: -1, lt: 24}).withMessage(`Hour must be a value between 00 and 23`),
    param('minute')
        .exists({ checkFalsy: true }).withMessage('Minute not provided')
        .isLength({ max: 2 }).withMessage('Minute can have a maximun of 2 characters: 01 or 1')
        .isNumeric().withMessage('Minute expected to be a Number')
        .isInt({ gt: -1, lt: 60}).withMessage(`Minute must be a value between 00 and 59`),
]

//TODO: check if solution works, to: this will get not have in consideration the date, add dat e to find query
// added line 128
export async function sendTimeslotByHour(req, res){
    res.setHeader('Content-Type', 'application/json');
    
    // In case of params validation failure, send error and end response.
    let result = validationResult(req);
    if(!(result.isEmpty())){
        res.json({ error: true, msg: (result.array())[0].msg })
        return res.end() 
    }

    // Generate a valid Date string from the params, in the format the DB expects
    // `${month_name} ${date}, ${year}`  |  e.g: March/2/2020   =>  "march 0, 2020" 
    let month = (req.params.month).toLowerCase()
        month = month.length <= 3 ? MONTHS_CONVERTER[month] : month;
    let day   = Number(req.params.day)
    let year  = req.params.year || new Date().getFullYear()
    let valid_date_string = `${month} ${day<10?'0'+day : day}, ${year}`

    // Generate ms from the time given by params, to work with DB's _ms version of time related values
    let hour      = Number(req.params.hour)
    let minute    = Number(req.params.minute)
    let hour_ms   = toMiliseconds(hour, 'hour')
    let minute_ms = toMiliseconds(minute, 'minute')
    let time_ms   = hour_ms + minute_ms
        time_ms > CLOSING_TIME_MS ? time_ms = CLOSING_TIME_MS : null;

    // Try to retrieve data from DB, if fail, send 500 error and and end response.
    // At success, send retrieved and sanitized data and end response.
    let found_timeslot = []
    try {
        found_timeslot = await Timeslot.find({
            start_ms:{$lte:time_ms}, 
            end_ms:{$gte:time_ms},
            date: valid_date_string
        })

        if(found_timeslot.length === 0){
            let empty_timeslot = Timeslot.getEmptyTimeslotsArray(valid_date_string)
            found_timeslot = empty_timeslot.filter(obj => obj.start_ms<=time_ms && obj.end_ms>=time_ms)
            res.json(found_timeslot)
            return res.end()
        }
        
        Timeslot.sanitizeTimeslotArray(found_timeslot)
        res.json(found_timeslot)
        return res.end()
    } catch (error) {
        console.log('\nLog @ appointment controller .sendTimeslotsByDate()')
        console.error(error)
        res.status(500).json({ error: true, msg: 'Internal Server Error'})
        return res.end() 
    }
}



//--------------------------------------------------------------------------------
// POST CREATE APPOINTMENT
//--------------------------------------------------------------------------------
// * - pasted from copilot chat
// To check if the request content type is application/json using express 
// you can create a custom middleware function that validates the Content-Type header of incoming requests. 
export const checkContentType = (req, res, next) => {
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
        res.status(400).json({ error: true, msg: 'Content-Type must be application/json' });
        return res.end()
    }else{
        next();
    }
}

//TODO: define phone and dni validation rules
//TODO: make it so, in this and other validators, you cant book on weekends
export const createPayloadValidator = [
    body('month')
        .exists({ checkFalsy: true }).withMessage('Month not provided')
        .isString().withMessage('Month expected to be a String').bail()
        .custom(value => MONTHS.includes(value.toLowerCase())).withMessage('Month format invalid'),
    body('day')
        .exists({ checkFalsy: true }).withMessage('Day not provided')
        .isLength({ max: 2 }).withMessage('Day can have a maximun of 2 characters: 01 or 1')
        .isNumeric().withMessage('Day expected to be a Number')
        .isInt({ gt: 0, lt: 32 }).withMessage('Day must be a value between 1 and 31'),
    body('year')
        .exists({ checkFalsy: true }).withMessage('Year not provided')
        .isNumeric().withMessage('Year expected to be a Number')
        .isInt({ gt: 1999, lt: 2999 }).withMessage('Year must be a value in this millennium'),
        
    body('hour')
        .exists().withMessage('Hour not provided')
        .isLength({ max: 2 }).withMessage('Hour can have a maximun of 2 characters: 01 or 1')
        .isNumeric().withMessage('Hour expected to be a Number').bail()
        .isInt({ gte: opening_hour, lt: closing_hour}).withMessage(`Hour must be a value between ${opening_hour} and ${closing_hour}`),
        // .isInt({ gt: -1, lt: 24}).withMessage(`Hour must be a value between 00 and 23`),
    body('minute')
        .exists().withMessage('Minute not provided')
        .isLength({ max: 2 }).withMessage('Minute can have a maximun of 2 characters: 01 or 1')
        .isNumeric().withMessage('Minute expected to be a Number')
        .isInt({ gt: -1, lt: 60}).withMessage(`Minute must be a value between 00 and 59`),

    body('name')
        .exists({ checkFalsy: true }).withMessage('Name not provided')
        .isString().withMessage('Name expected to be a String').bail()
        .isLength({ max: 35 }).withMessage('Name can have a maximun of 35 characters'),
    body('dni')
        .exists({ checkFalsy: true }).withMessage('Dni not provided')
        .isNumeric().withMessage('Dni expected to be a Number').bail()
        .isInt({ gt: 1000000, lt: 100000000000}).withMessage(`Dni must be a value between 1000000 and 100000000000`),
    body('email')
        .exists({ checkFalsy: true }).withMessage('Email not provided')
        .isString().withMessage('Email expected to be a String').bail()
        .isEmail().withMessage('Email format invalid')
        .isLength({ max: 254 }).withMessage('Email can have a maximun of 254 characters'),
    body('phone')
        .exists({ checkFalsy: true }).withMessage('Phone not provided')
        // .isString().withMessage('Phone expected to be a String').bail()
        // .isMobilePhone('any').withMessage('Phone format invalid'),
        .isNumeric().withMessage('Phone expected to be a Number').bail()
        .isLength({ max: 15 }).withMessage('Phone can have a maximun of 15 characters'),        
]

export async function handleAppointmentCreation(req, res) {
    res.setHeader('Content-Type', 'application/json');
    
    // In case of payload validation failure, send error and end response.
    let result = validationResult(req);
    if(!(result.isEmpty())){
        res.json({ error: true, msg: (result.array())[0].msg })
        return res.end() 
    }


    // Generate a valid Date string from the payload, in the format the DB expects
    // `${month_name} ${date}, ${year}`  |  e.g: March/2/2020   =>  "march 0, 2020" 
    let month = (req.body.month).toLowerCase()
        month = month.length <= 3 ? MONTHS_CONVERTER[month] : month;
    let day   = Number(req.body.day)
    let year  = req.body.year || new Date().getFullYear()
    let valid_date_string = `${month} ${day<10?'0'+day : day}, ${year}`
    
    
    //Generate a valid Hour string from the payload, in the format the DB expects
    // `${hour}:${minutes}` | e.g: "15:30"
    let valid_hour_ms = toMiliseconds(Number(req.body.hour),'hour') + toMiliseconds(Number(req.body.minute),'minute')
    let valid_hour_string = `${fromMiliseconds(valid_hour_ms,'hour_string')}`


    //TODO: check first if slot is available in timeslot of given date, at given hour
    let found_timeslot = []
    try {
        found_timeslot = await Timeslot.find({
            start_ms:{$lte:valid_hour_ms}, 
            end_ms:{$gte:valid_hour_ms},
            date: valid_date_string
        })

        if(found_timeslot.length !== 0){
            let appointment_slot = found_timeslot[0].appointments.find(obj => obj.hour === valid_hour_string);
            if(typeof appointment_slot == 'undefined' ){
                res.json({error:true, appointment_created: false, msg:`${valid_hour_string} was not found to be a valid time stamp. start_time: "${found_timeslot[0].start_time}", end_time: "${found_timeslot[0].end_time}", time_step: "${found_timeslot[0].time_step}"`})
                return res.end()
            }

            if(appointment_slot.available){
                appointment_slot.available = !appointment_slot.available
                let new_appointment = await Appointment.create({
                    ...req.body,
                    date: valid_date_string,
                    hour: valid_hour_string,    
                    hour_ms: valid_hour_ms,
                })
                appointment_slot.appointment = new_appointment._id
                found_timeslot[0].appointments_available = found_timeslot[0].appointments_available - 1

                await found_timeslot[0].save()
                res.json({error:false, appointment_created: true})
                return res.end()
               
            }else{
                res.json({error:true, appointment_created: false, msg:`The hour requested (${valid_hour_string}) is not available`})
                return res.end()
            }
            
        }
        else{
            let empty_timeslots_array = Timeslot.getEmptyTimeslotsArray(valid_date_string)
            let empty_timeslot = empty_timeslots_array.find(obj => obj.start_ms <= valid_hour_ms && obj.end_ms >= valid_hour_ms)
            
            let new_timeslot = null
            new_timeslot = new Timeslot(empty_timeslot)                
            
            let appointment_slot = new_timeslot.appointments.find(obj => obj.hour === valid_hour_string);
            appointment_slot.available = !appointment_slot.available
            new_timeslot.appointments_available = new_timeslot.appointments_available - 1
            
            let new_appointment = new Appointment({
                ...req.body,
                date: valid_date_string,
                hour: valid_hour_string,    
                hour_ms: valid_hour_ms,
            })
            appointment_slot.appointment = new_appointment._id 

            new_timeslot.save()
            new_appointment.save()
            
            /* //TODO: explore mongoose sessions and transactions
               /pasted from copilot, To ensure that both new_timeslot.save() and new_appointment.save() operations succeed simultaneously or fail together, you can use a transaction. Transactions allow you to execute multiple operations in isolation and potentially undo all the operations if one of them fails.
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
                // Save new_timeslot
                await new_timeslot.save({ session });

                // Save new_appointment
                await new_appointment.save({ session });

                // Commit the transaction
                await session.commitTransaction();
                session.endSession();

                console.log('Both documents saved successfully!');
            } catch (error) {
                // If any save operation fails, abort the transaction
                await session.abortTransaction();
                session.endSession();

                console.error('Error saving documents:', error);
            }
            */
            
            
            res.json({error:false, appointment_created: true})
            return res.end()

        }

    } catch (error) {
        console.log('\nLog @ appointment controller .handleAppointmentCreation()')
        console.error(error)
        res.status(500).json({ error: true, appointment_created: false, msg: 'Internal Server Error'})
        return res.end() 
    }
    
    

    let tester = await new Appointment({
        ...req.body,
        date: valid_date_string,
        hour: valid_hour_string,    
        hour_ms: valid_hour_ms,
    })

    res.json(tester)

}



export default () => { }
export * from './appointment.js'


