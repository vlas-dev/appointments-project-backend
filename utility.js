
// ---------------
// To Miliseconds
/**
 * @param value  the value to convert as an integer
 * @param type  the type of value as a string or number: hour/1, minute/2
*/
export function toMiliseconds(value, type='minute'){
    if(type == 'hour' || type == 'hours' || type == 1){
        return hoursToMilliseconds(value)
    }
    if(type == "minute" || type == "minutes" || type == 2){
        return minutesToMilliseconds(value)
    }
    throw new Error(" [utility.js] Something went wrong @ toMiliseconds()");
}
export function hoursToMilliseconds(hours) {
    return hours * 60 * 60 * 1000; // 1 hour = 60 minutes = 60 seconds = 60,000 milliseconds
}
export function minutesToMilliseconds(minutes) {
    return minutes * 60 * 1000; // 1 minute = 60 seconds = 60,000 milliseconds
}

// ---------------
// From Miliseconds
/**
 * @param value  the value to convert as an integer
 * @param type  the type of value as a string: minutes, hours, hour_string
 */
export function fromMiliseconds(value, type='hour_string'){
    let date = new Date(value)
    if(type == 'hour' || type == 'hours' || type == 1){
        return date.getUTCHours()
    }
    if(type == "minute" || type == "minutes" || type == 2){
        return date.getUTCMinutes()
    }
    if(type = 'hour_string'){
        let hour = String(date.getUTCHours()).padStart(2, '0');
        let minute = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hour}:${minute}`
    }
    throw new Error(" [utility.js] Something went wrong @ fromMiliseconds()");
} 