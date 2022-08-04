export default class LMSAdapterUtils {

  /*******************************************************************************
   ** this function will convert seconds into hours, minutes, and seconds into the
   ** CMITimespan type format - HHHH:MM:SS.SS (Hours can have a max of 4 digits &
   ** Min of 2 digits according to the SCORM spec.  This function always returns 4 digits.
   ** Parameters: ms is a timestamp in milliseconds.  If ms is undefined or null, then
   **             use the current time in milliseconds.
   ** Usage: GetCMITimespan(239) will return "0000:03:59"
   **        GetCMITimespan(240) will return "0000:04:00"
   ******************************************************************************/
  public static getCMITimespan(ms: number): string {
    let ts = new Date().getTime();

    // if ms is undefined or null, use the current time for ts, else use the passed in value in ms
    if (ms !== undefined && ms !== null) {
      ts = ms;
    }

    // round to nearest sec - fixes bug where e.g. 179.996s converts to 00:02:60
    // loses millisecond accuracy
    ts = Math.round(ts);

    // find the number of seconds remaining after all the whole minutes have been
    // accounted for,
    // e.g. 240 = 0 secs, 242 = 2 secs
    const secs = ts % 60;

    // remove the number of seconds from the ts value
    ts -= secs;

    // find the number of minutes remaining after all the whole hours (3600 seconds) have been
    // accounted for,
    let mins = ts % 3600;

    // remove the number of minutes from the ts value, leaving the hours value
    ts -= mins;

    // turn whole seconds into minutes, e.g. 60 seconds becomes 1 min.
    // e.g. 240 secs = 2 mins
    mins = mins / 60;

    // the remaining figure in ts is just hours.
    // it should be directly divisible by 3600 seconds (i.e. one hour)
    const hours = ts / 3600;

    // get proper string objects, ready to add zero
    // characters if necessary
    let strSecs = new String(secs);
    let strMins = new String(mins);
    let strHours = new String(hours);

    if (strSecs.length < 2) {
      strSecs = "0" + strSecs;
    }

    if (strMins.length < 2) {
      strMins = "0" + strMins;
    }

    // ensure the hours figure is four digits long, e.g. 0001 would be one hour
    while (strHours.length < 4) {
      strHours = "0" + strHours;
    }

    const timespan = strHours + ":" + strMins + ":" + strSecs + ".00";

    return timespan;
  }

  // SCORM LMS's sometimes return a boolean or a string value of "true".  Return both as true else false.
  public static isBool(value: any) {
    if (value.toString().toUpperCase() === "TRUE" || value === true) {
      return true;
    }

    return false;
  }
}
