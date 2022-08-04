import AdapterError from "./AdapterError";
import SCORMAdapter from "./SCORMAdapter";
import { SCORMLessonStatus } from "./SCORMConstants";

export default class AICCAdapter extends SCORMAdapter {
  private _version = "1.0";
  private _id = "";
  private _lmsUrl = "";
  private _lmsResponse = "";
  private _suspendData = "";
  private _lessonLocation = "";
  private _lessonStatus = "";
  private _score = 0;
  private _entryValue = "";
  private _studentId = "";
  private _studentName = "";
  private _totalTime = 0;
  private _sessionTime = 0;
  private _lmsResponseError = 0;
  private _lmsResponseErrorText = "";

  // look for SCORM api in parent window and initialise this object
  constructor(aiccId: string, aiccUrl: string) {
    super();
    this._id = aiccId;
    this._lmsUrl = aiccUrl;
    this.initialiseConnection();
  }

  private async initialiseConnection() {
    try {
      const data =
        "command=GetParam&version=" +
        decodeURI(this._version) +
        "&session_id=" +
        decodeURI(this._id);

      const response = await fetch(this._lmsUrl, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "omit", // include, *same-origin, omit
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: data // body data type must match "Content-Type" header
      });

      const result = await response.text();
      this.processResponse(result);

      // IR 06 July 2016 - added additional check for Rustici SCORM engine, which doesn't return 'successful' in the response error text, but
      // returns a zero error code only
      if (
        this._lmsResponseErrorText.toLowerCase() == "successful" ||
        (this._lmsResponseErrorText.toLowerCase() == "" &&
          this._lmsResponseError == 0)
      ) {
        this._connected = true;
      }
    } catch (e) {
      throw new AdapterError("Failed to initiate AICC LMS object. ", {
        cause: e
      });
    }
  }

  public async commitToLMS(): Promise<boolean> {
    const preparedFields = this.prepareData();
    const data =
      "command=PutParam&version=" +
      decodeURI(this._version) +
      "&session_id=" +
      decodeURI(this._id) +
      "&AICC_Data=" +
      decodeURI(preparedFields);

    const response = await fetch(this._lmsUrl, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "omit", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: data // body data type must match "Content-Type" header
    });

    this._lmsResponse = await response.text();
    this.processResponse(this._lmsResponse);
    this.lastCommit = new Date().getTime();
    return true;
  }

  public async finishLMSSession(): Promise<boolean> {
    try {
      const data = this.prepareData();

      if (navigator.sendBeacon !== undefined) {
        const fd = new FormData();
        fd.append("command", "ExitParam"); // AICC command should be ExitAU but we have created a customised one for e-LfH
        fd.append("version", this._version);
        fd.append("session_id", this._id);
        fd.append("AICC_Data", data); // normal ExitAU command would not include an AICC_Data param.

        const result = navigator.sendBeacon(this._lmsUrl, fd);
        return result;
      } else {
        // make sure any outstanding data is saved (syncronous call)
        this.commitToLMS();

        const data =
          "command=ExitAU&version=" +
          decodeURI(this._version) +
          "&session_id=" +
          decodeURI(this._id);

        await fetch(this._lmsUrl, {
          method: "POST", // *GET, POST, PUT, DELETE, etc.
          mode: "cors", // no-cors, *cors, same-origin
          cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
          credentials: "omit", // include, *same-origin, omit
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          redirect: "follow", // manual, *follow, error
          referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
          body: data // body data type must match "Content-Type" header
        });

        this.reset();
        this._connected = false;
        return true;
      }
    } catch (e) {
      throw new AdapterError("Error saving data to AICC LMS.", { cause: e });
    }
  }

  public setSessionTime(value: number) {
    // capture any errors in this function or the functions it depends upon
    try {
      const sessionTime = this.elapsedTime(value);

      this._sessionTime = parseInt(sessionTime, 10);
    } catch (e) {
      throw new AdapterError("Unable to set session time", { cause: e });
    }
  }

  get lessonLocation(): string {
    return this._lessonLocation;
  }

  set lessonLocation(value: string) {
    this._lessonLocation = value;
  }

  get lessonStatus(): string {
    return this._lessonStatus;
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
      this._lessonStatus = tempValue;
    } else {
      throw new Error(
        "Trying to set an invalid lesson status value of - " + value
      );
    }
  }

  get masteryScore(): number {
    return this._masteryScore;
  }

  set masteryScore(value: number) {
    this._masteryScore = value;
  }

  get score(): number {
    return this._score;
  }

  set score(value: number) {
    this._score = value;
  }

  get studentId(): string {
    return this._studentId;
  }

  get studentName(): string {
    return this._studentName;
  }

  get suspendData(): string {
    return this._studentName;
  }

  set suspendData(value: string) {
    this._suspendData = value;
  }

  set sessionTime(value: number) {
    this._sessionTime = value;
  }

  get totalTime(): number {
    return this._totalTime;
  }

  private reset() {
    this._id = "";
    this._lmsUrl = "";
    this._lmsResponse = "";
    this._suspendData = "";
    this._masteryScore = 0;
    this._lessonLocation = "";
    this._lessonStatus = "";
    this._score = 0;
    this._studentId = "";
    this._entryValue = "";
    this._studentName = "";
    this._sessionTime = 0;
    this._totalTime = 0;
  }

  private prepareData() {
    const sCRLF = String.fromCharCode(13, 10);

    let sData = "";

    sData += "[CORE]" + sCRLF;
    //sData += "Lesson_Location="+ g_sLmsCmiLocation + sCRLF;
    sData += "Lesson_Location=" + this._lessonLocation + sCRLF;
    //sData += "Lesson_Status="+ sStatus + sCRLF;
    sData += "Lesson_Status=" + this._lessonStatus + sCRLF;
    //sData += "Score="+ sScore + sCRLF;
    sData += "Score=" + this._score + sCRLF;
    sData += "Time=" + this._sessionTime + sCRLF;

    sData += "[CORE_LESSON]" + sCRLF;
    //sData += "Suspend_Data="+ g_sLmsCmiSuspendData + sCRLF;
    sData += "Suspend_Data=" + this._suspendData + sCRLF;

    sData += "[OBJECTIVES_STATUS]" + sCRLF;

    return sData;
  }

  private processResponse(sResponse: string) {
    const sCR = String.fromCharCode(10);

    let sSrc = decodeURI(sResponse);

    // Remove comments
    sSrc = sSrc.replace(/^;.*$/gm, "");

    const re = /^\[(\w+)\]$/m;
    const sNameSeparator = " ";

    let pGroups = [];

    for (;;) {
      if (sSrc.length == 0) break;

      const nGroupBegin = sSrc.search(re);

      //top section
      const topSection = sSrc.substr(0, nGroupBegin - 1);
      const elements = topSection.split(sCR);

      for (let i = 0; i < elements.length; i++) {
        const element = elements[i].split("=");

        if (element.length == 2 && element[1].length > 0) {
          const key = element[0].toLowerCase();
          let value = element[1].replace(/^\s+|\s+$/g, "");

          if (value == undefined || value == null) {
            value = "";
          }

          if (key == "error") {
            this._lmsResponseError = parseInt(value, 10);
          } else if (key == "error_text") {
            this._lmsResponseErrorText = value;
          } else if (key == "student_id") {
            this._studentId = value;
          } else if (key == "student_name") {
            this._studentName = value;
          } else if (key == "lesson_location") {
            this._lessonLocation = value;
          } else if (key == "lesson_status") {
            // this contains a comma, then this field contains both the lesson_status and the core.entry value
            // otherwise it contains on the lesson_status
            if (value.indexOf(",") > -1) {
              // split up lesson status and entry value
              const temp = value.split(",");

              this._lessonStatus = this.unAbbreviateCompletionStatus(temp[0]);
              this._entryValue = this.unAbbreviateEntry(temp[1]);
            } else {
              this._lessonStatus = this.unAbbreviateCompletionStatus(value);
            }
          } else if (key == "score") {
            if (value == "") {
              this._score = 0;
            } else {
              this._score = parseInt(value, 10);
            }
          } else if (key == "time") {
            this._totalTime = parseFloat(value);
          }
        }
      }

      // bottom section
      sSrc = sSrc.substr(nGroupBegin);

      let sGroup = sSrc.replace(re, "$1" + sNameSeparator);
      const sGroupName = sGroup.substr(0, sGroup.search(sNameSeparator));
      sGroup = sGroup.substr(sGroupName.length + 1);

      let nNextGroupBegin = sGroup.search(re);
      if (nNextGroupBegin == -1) nNextGroupBegin = sGroup.length;

      sSrc = sGroup.substr(nNextGroupBegin);
      sGroup = sGroup.substr(0, nNextGroupBegin);

      // Remove extra line breaks
      sGroup = sGroup.replace(/[\n\r]+/gm, sCR);
      sGroup = sGroup.replace(/^[\n]+/gm, "");

      const oGroup: any = { sName: "", arVars: "", pNext: [] };
      oGroup.sName = sGroupName.toLowerCase();
      oGroup.arVars = sGroup.split(sCR);
      oGroup.pNext = pGroups;
      pGroups = oGroup;
    }

    for (let oGroup = pGroups; oGroup != null; oGroup = oGroup.pNext) {
      for (let i = 0; i < oGroup.arVars.length; i++) {
        const sPair = oGroup.arVars[i];
        if (sPair.length > 0) {
          const nBegin = sPair.search("=");
          let sName = sPair.substring(0, nBegin);
          let sValue = sPair.substring(nBegin + 1);

          sName = sName.toLowerCase();

          if (oGroup.sName == "core") {
            switch (sName) {
              case "lesson_status": {
                sValue = sValue.toLowerCase();
                const arValues = sValue.split(",");

                this._lessonStatus = arValues[0];

                /*  IR - entry value isn't needed for aicc sessions.
                                var sFlag = "r";
                                if (arValues.length > 1)
                                    sFlag = arValues[1];
    
                                if (sFlag == "r" || sFlag == "resume")
                                    g_sLmsCmiEntry = "resume";
                                */
                break;
              }
            }
          } else if (oGroup.sName == "core_lesson") {
            switch (sName) {
              case "suspend_data":
                this._suspendData = sValue;
                break;
            }
          } else if (oGroup.sName == "student_data") {
            switch (sName) {
              case "mastery_score":
                this._masteryScore = sValue;
                break;
            }
          }
        }
      }
    }
  }

  private unAbbreviateCompletionStatus(s: string) {
    // not attempted
    // na
    // n
    let status = s.trim().toLowerCase();

    switch (status) {
      case "c":
        status = "completed";
        break;
      case "i":
        status = "incomplete";
        break;
      case "n":
      case "na":
        status = "not attempted";
        break;
      case "p":
        status = "passed";
        break;
      case "f":
        status = "failed";
        break;
      case "b":
        status = "browser";
        break;
    }

    return status;
  }

  private unAbbreviateEntry(s: string) {
    let entry = s.trim().toLowerCase();

    switch (entry) {
      case "a":
      case "ab":
        entry = "ab-initio";
        break;
      case "r":
        entry = "resume";
        break;
    }

    return entry;
  }
}
