
import {fromMiliseconds} from "./utility.js"
// ENVIROMENT VALUES


// SV
// ---------------------------------------------------------------------------------------
    export const PORT        = process.env.PORT        || 7010
    export const DB_USERNAME = process.env.DB_USERNAME || 'appointments-admin-1'
    export const DB_PASSWORD = process.env.DB_PASSWORD || 'appointments-admin-secret-password'
    export const SV_PASSWORD = process.env.SV_PASSWORD || 'sv_password'
// ---------------------------------------------------------------------------------------


// APPOINTMENT/TIMESLOT
// ---------------------------------------------------------------------------------------
//TODO: make sure constant values are valid, closing cant be lt opening, timeslot length cant be gt working time, etc
    export const OPENING_TIME              = process.env.OPENING_TIME                  || "09:00"  //hs string
    export const CLOSING_TIME              = process.env.CLOSING_TIME                  || "17:00"  //hs string

    export const OPENING_TIME_MS           = new Date(`January 1, 1970, ${OPENING_TIME}:00 UTC`).getTime()
    export const CLOSING_TIME_MS           = new Date(`January 1, 1970, ${CLOSING_TIME}:00 UTC`).getTime()
    export const WORKING_TIME_MS           = CLOSING_TIME_MS - OPENING_TIME_MS

    export const TIMESLOT_LENGTH           = process.env.TIMESLOT_LENGTH               || "01:00"
    export const TIMESLOT_LENGTH_MS        = new Date(`January 1, 1970, ${TIMESLOT_LENGTH}:00 UTC`).getTime()
    export const TIMESLOT_AMOUNT           = Math.floor(WORKING_TIME_MS/TIMESLOT_LENGTH_MS)

    export const APPOINTMENTS_PER_TIMESLOT = process.env.TIMESLOT_LENGTH               || 1
    export const TIMESLOT_STEP_MS          = TIMESLOT_LENGTH_MS/APPOINTMENTS_PER_TIMESLOT
    export const TIMESLOT_STEP             = fromMiliseconds(TIMESLOT_STEP_MS,'hour_string')
// ---------------------------------------------------------------------------------------



//logEnviroment()
export default function logEnviroment(){
    console.log("LOG AT ENVIROMENT JS")
    console.log("PORT: ",PORT)
    console.log("DB_USERNAME: ",DB_USERNAME)
    console.log("DB_PASSWORD: ",DB_PASSWORD)
    
    console.log('')
    console.log("OPENING_TIME: ", OPENING_TIME)
    console.log("CLOSING_TIME: ", CLOSING_TIME)
    console.log('')
    console.log("OPENING_TIME_MS: ", OPENING_TIME_MS)
    console.log("CLOSING_TIME_MS: ", CLOSING_TIME_MS)
    console.log("WORKING_TIME_MS: ", WORKING_TIME_MS)
    console.log('')
    console.log("TIMESLOT_LENGTH: ", TIMESLOT_LENGTH)
    console.log("TIMESLOT_LENGTH_MS: ", TIMESLOT_LENGTH_MS)
    console.log("TIMESLOT_AMOUNT: ", TIMESLOT_AMOUNT)
    console.log('')
    console.log("APPOINTMENTS_PER_TIMESLOT: ", APPOINTMENTS_PER_TIMESLOT)
    console.log('TIMESLOT_STEP_MS: ', TIMESLOT_STEP_MS)
    console.log('TIMESLOT_STEP: ', TIMESLOT_STEP)
}