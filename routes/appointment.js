import express from 'express'
import { 
    sendTimeslotsByDate, sendTimeslotByHour, 
    dateParamValidator, hourParamValidator,
    createPayloadValidator, checkContentType, handleAppointmentCreation 
} from '../controller/appointment.js'

const router = express.Router()


//* Glossary
//  appointment = An object that holds the personal information of the user.
//  timeslot    = An object that holds all the appointments objects for a certain timeframe (hours).


router.get('/date/:month?/:day?/:year?',
    [dateParamValidator],
    sendTimeslotsByDate
    //Success response: Returns a JSON object with all the timeslots of the given date, 
    //(since this route is public, timeslots wont have the appointments objects, but a Number indicating their amount).
)

// router.get('/time/:hour?/:minute?', 
//     [hourParamValidator],
//     sendTimeslotByHour
// )

router.get('/date/:month?/:day?/:year?/time/:hour?/:minute?', 
    [dateParamValidator, hourParamValidator],
    sendTimeslotByHour
)

router.post('/create', 
    checkContentType, 
    [createPayloadValidator],
    handleAppointmentCreation
)

export default router