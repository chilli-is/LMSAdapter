import LMSAdapterInterface from "./LMSAdapterInterface";
import { SCORMLessonStatus, SCORMExitStatus } from "./SCORMConstants";
import AdapterError from "./AdapterError";
import LMSAdapterUtils from "./LMSAdapterUtils";
import SCORMGetterSetter from "./SCORMGetterSetter";

export default class SCORMAdapter implements LMSAdapterInterface {
  private _findAPITries = 0;
  private _api: any;
  private _getterSetter: SCORMGetterSetter;
  protected _sessionStartTime = 0;
  protected _connected = false;
  protected _masteryScore = 0;

  public coreLMSSupportedElements = new Array<string>();
  public studentDataLMSSupportedElements = new Array<string>();

  public lastCommit = 0;

  // look for SCORM api in parent window and initialise this object
  constructor() {
    this._api = this.getAPI();
    this._getterSetter = new SCORMGetterSetter(this._api);

    if (this._api != null) {
      const connection = this._api.LMSInitialize("") as any;
      if (
        connection.toString().toUpperCase() === "TRUE" ||
        connection === true
      ) {
        this._connected = true;
      }

      if (this._connected) {
        this._getterSetter.connected = true;
        this._sessionStartTime = new Date().getTime();

        try {
          const children = this._getterSetter.getValue("cmi.core._children"); // get LMS supported elements

          if (children != null && children.length > 0) {
            this.coreLMSSupportedElements = children.split(",");
          }
        } catch (e) {
          throw new AdapterError(
            "Unable to get supported elements (core._children) from LMS",
            {cause: e }
          );
        }

        try {
          const children = this._getterSetter.getValue("cmi.student_data._children"); // get LMS supported elements

          if (children != null && children.length > 0) {
            this.studentDataLMSSupportedElements = children.split(",");
          }
        } catch (e) {
          throw new AdapterError(
            "Unable to get supported elements (core.student_data._children) from LMS",
            { cause: e }
          );
        }
      }
    } else {
      this._connected = false;
    }
  }

  get isConnected(): boolean {
    return this._connected;
  }

  get lessonStatus(): string {
    return this._getterSetter.getValue("cmi.core.lesson_status");
  }

  set lessonStatus(value: string) {
    const tempValue = value.toLowerCase();

    // only allow one of these six values to be set in the LMS
    if (
      tempValue === SCORMLessonStatus.PASSED ||
      tempValue === SCORMLessonStatus.FAILED ||
      tempValue === SCORMLessonStatus.COMPLETED ||
      tempValue === SCORMLessonStatus.INCOMPLETE ||
      tempValue == SCORMLessonStatus.BROWSED ||
      tempValue == SCORMLessonStatus.NOT_ATTEMPTED
    ) {
      this._getterSetter.setValue("cmi.core.lesson_status", value);
    } else {
      throw new Error(
        "Trying to set an invalid lesson status value of - " + value
      );
    }
  }

  get studentId(): string {
    return this._getterSetter.getValue("cmi.core.student_name");
  }

  get studentName(): string {
    return this._getterSetter.getValue("cmi.core.student_name");
  }

  get lessonLocation(): string {
    const location = this._getterSetter.getValue("cmi.core.lesson_location");

    if (location === null || location === "") {
      return "0";
    }
    return location;
  }

  set lessonLocation(value: string) {
    this._getterSetter.setValue("cmi.core.lesson_location", value);
  }

  get lessonMode(): string {
    return this._getterSetter.getValue("cmi.core.lesson_mode");
  }

  get suspendData(): string {
    return this._getterSetter.getValue("cmi.suspend_data");
  };

  set suspendData(value: string) {
    this._getterSetter.setValue("cmi.suspend_data", value);
  }

  get score(): number {
    return parseInt(this._getterSetter.getValue("cmi.core.score.raw"), 10);
  };

  set score(value: number) {
    this._getterSetter.setValue("cmi.core.score.raw", value.toString());
  }

  get minScore(): number {
    return parseInt(this._getterSetter.getValue("cmi.core.score.min"), 10);
  };

  set minScore(value: number) {
    this._getterSetter.setValue("cmi.core.score.min", value.toString());
  }

  get maxScore(): number {
    return parseInt(this._getterSetter.getValue("cmi.core.score.max"), 10);
  };

  set maxScore(value: number) {
    this._getterSetter.setValue("cmi.core.score.max", value.toString());
  }

  get totalTime(): number {
    return this._getterSetter.getValue("cmi.core.total_time");
  }

  get launchData(): string {
    return this._getterSetter.getValue("cmi.launch_data");
  }

  get lmsComments(): string {
    return this._getterSetter.getValue("cmi.comments_from_lms");
  }

  set comments(value: string) {
    this._getterSetter.setValue("cmi.comments", value);
  }

  get comments(): string {
    return this._getterSetter.getValue("cmi.comments");
  }

  // Definition: Indicates whether the student is being credited by the LMS system based on performance
  // (pass/fail and score) in this SCO.
  // Usage:  Used by the LMS to indicate whether or not the student is taking the SCO for credit.
  // cmi.core.credit is used in conjunction with lesson_mode to determine lesson_status.
  // LMS should return either "credit" or "no-credit"
  get credit(): string {
    return this._getterSetter.getValue("cmi.core.credit");
  }

  // Indication of whether the student has been in the SCO before.
  // 3 possible values:
  // ab-initio - the first time the student is entering the SCO.
  // resume - indicates the user has been in the SCO before.
  // "" - an empty string indicates neither ab-initio, nor resume.  This might be
  //      be used to indicate the SCO had been completed and was being viewed
  //      again for review purposes.
  get entry(): string {
    return this._getterSetter.getValue("cmi.core.entry");
  }

  // An indication of how or why the student left the SCO.  Write only.
  // 3 possible values:
  // time-out - indicates the SCO ended because an excessive amount of time elapsed, or
  //            max_time_allowed has been exceeded.
  // suspend - indicates the user leaves the SCO with the intent of returning to it later
  //           at the point where they left.
  // logout - indicates the user logged out from within the SCO.
  // "" - indicates a normal exit state initiated by the LMS and not from within the SCO.
  set exit(value: string) {
    this._getterSetter.setValue("cmi.core.exit", value);
  }

  //*** Student Data Elements *** */
  get masteryScore(): number {
    return parseInt(this._getterSetter.getValue("cmi.student_data.mastery_score"), 10);
  }

  set masteryScore(value: number) {
    this._masteryScore = value;
  }

  get maxTimeAllowed(): string {
    return this._getterSetter.getValue("cmi.student_data.max_time_allowed");
  }

  get timeLimitAction(): string {
    return this._getterSetter.getValue("cmi.student_data.time_limit_action");
  }

  // *********  End Student Data Elements ****************

  public async finishSession(): Promise<boolean> {
    if (this._connected === true && this._api != null) {
      // set exit value.
      // if the lesson status is completed, passed or failed set the status to "logout",
      // else the student may come back to this SCO so set status to "suspend"
      const lessonStatus = this.lessonStatus;
      if (
        lessonStatus == SCORMLessonStatus.COMPLETED ||
        lessonStatus == SCORMLessonStatus.PASSED ||
        lessonStatus == SCORMLessonStatus.FAILED
      ) {
        this._getterSetter.setValue("cmi.core.exit", SCORMExitStatus.LOGOUT);
      } else {
        this._getterSetter.setValue("cmi.core.exit", SCORMExitStatus.SUSPEND);
      }

      // record the session time before the commit
      this.setSessionTime(this._sessionStartTime);

      // call the LMSFinish function that should be implemented by the API
      const result = LMSAdapterUtils.isBool(this._api.LMSFinish(""));

      this._connected = false;

      return result;
    }

    return false;
  }

  public async commitValues(): Promise<boolean> {
    if (this._connected && this._api != null) {
      // call the LMSFinish function that should be implemented by the API
      const result = LMSAdapterUtils.isBool(this._api.LMSCommit(""));

      if (result === true) {
        this.lastCommit = new Date().getTime();
        return result;
      }
    }

    return false;
  }

  // The amount of time in hours, minutes and seconds that the student has spent in the SCO
  // at the time they leave it.  The time from the beginning of the session to the end of
  // a single use of the SCO.
  // LMS will use this time in determining the cmi.core.total_time.
  // Format: HHHH:MM:SS.SS (hours has a min. of 2 digits and a maximum of 4, minutes shall
  //                        consist of 2 digits, with an optional decimal point and 1 or 2
  //                        additional digits (i.e. 34.45).
  // Data Type: CMITimespan
  public setSessionTime(value: number) {
    // capture any errors in this function or the functions it depends upon
    try {
      const sessionTime = this.elapsedTime(value);

      this._getterSetter.setValue("cmi.core.session_time", sessionTime);
    } catch (e) {
      throw new AdapterError("Unable to set session time", { cause: e });
    }
  }

  protected elapsedTime(startDate: number) {
    let formattedTime = "";

    if (startDate != 0) {
      const currentDate = new Date().getTime();

      // take the current date in milliseconds and minus the start date in milliseconds,
      // and return the elapsed time in seconds and milliseconds, e.g. 5.005 seconds.
      const elapsedSeconds = (currentDate - startDate) / 1000;
      formattedTime = LMSAdapterUtils.getCMITimespan(elapsedSeconds);
    } else {
      formattedTime = "0000:00:00.0";
    }

    return formattedTime;
  }

  private findAPI(win: any): any {
    while (win.API == null && win.parent != null && win.parent != win) {
      this._findAPITries++;
      // Note: 10 is an arbitrary number, you could increase or decrease this but 10 should be enough.
      if (this._findAPITries > 7) {
        return null;
      }

      win = win.parent;
    }

    return win.API;
  }

  private getAPI(): any {
    let foundAPI = this.findAPI(window);

    if (
      foundAPI == null &&
      window.opener != null &&
      typeof window.opener != "undefined"
    ) {
      foundAPI = this.findAPI(window.opener);
    }

    return foundAPI;
  }
}
