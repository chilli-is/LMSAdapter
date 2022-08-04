import LMSAdapterInterface from "@/models/scorm/LMSAdapterInterface";
import SCORMAdapter from "@/models/scorm/SCORMAdapter";
import AICCAdapter from "@/models/scorm/AICCAdapter";
import { SCORMLessonStatus } from "@/models/scorm/SCORMConstants";

export default class LMSAdapterFactory {
  // determine which LMS adapter to use, SCORM or AICC,
  // then return that adapter
  public static createAdapter(queryString: string): LMSAdapterInterface {
    let lmsAdapter = new SCORMAdapter();

    // look in the query string for the text aicc_sid and aicc_url
    if (queryString.length > 0) {
      let aiccId = "";
      let aiccUrl = "";

      const pairs = queryString.split("&");
      for (let i = 0; i < pairs.length; i++) {
        if (pairs[i].indexOf("?") == 0) {
          pairs[i] = pairs[i].substring(1, pairs[i].length);
        }

        const pair = pairs[i].split("=");
        if (pair.length == 2) {
          const sName = pairs[0].toLowerCase();
          const sValue = pairs[1];

          switch (sName) {
            case "aicc_sid":
              aiccId = decodeURI(sValue);
              break;
            case "aicc_url":
              aiccUrl = decodeURI(sValue);
              break;
          }
        }
      }

      if (aiccId != "" && aiccUrl != "") {
        lmsAdapter = new AICCAdapter(aiccId, aiccUrl);
      }
    }

    if (lmsAdapter.isConnected === true) {
      // is this the first time the session has been started by this user?
      // i.e. is the lesson status not attempted or is the entry value ab-initio?
      if (
        lmsAdapter.lessonStatus === SCORMLessonStatus.NOT_ATTEMPTED ||
        lmsAdapter.lessonStatus === "" ||
        lmsAdapter.entry === SCORMLessonStatus.AB_INITIO
      ) {
        // this is the first attempt
        lmsAdapter.lessonStatus = SCORMLessonStatus.INCOMPLETE;
      }

      // commit values to the LMS to record the fact the user
      // started the SCO and to double-check there are no LMS connection issues
      lmsAdapter.commitValues();
    }

    return lmsAdapter;
  }
}
