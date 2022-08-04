import AdapterError from "./AdapterError";
import {
  SCORMInteractionResultType,
  SCORMInteractionType,
  SCORMObjectiveStatus
} from "./SCORMConstants";
import SCORMGetterSetter from "./SCORMGetterSetter";
import SCORMInteraction from "./SCORMInteraction";
import SCORMObjectivesAdapter from "./SCORMObjectivesAdapter";

export default class SCORMInteractionsAdapter {
  private _api: any;
  private _getterSetter: SCORMGetterSetter;
  private _scormObjectivesAdapter: SCORMObjectivesAdapter;
  // private _objectivesEnabled: false;
  public lmsSupportedElements = new Array<string>();

  constructor(
    api: any,
    getterSetter: SCORMGetterSetter,
    scormObjectivesAdapter: SCORMObjectivesAdapter
  ) {
    this._api = api;
    this._getterSetter = getterSetter;
    this._scormObjectivesAdapter = scormObjectivesAdapter;
    try {
      const children = this._getterSetter.getValue(
        "cmi.interactions._children"
      ); // get LMS supported elements

      if (children != null && children.length > 0) {
        this.lmsSupportedElements = children.split(",");
      }
    } catch (e) {
      throw new AdapterError(
        "Unable to get supported elements (interactions._children) from LMS",
        { cause: e }
      );
    }
  }

  public createSCORMInteraction(): SCORMInteraction {
    const i = new SCORMInteraction();
    return i;
  }

  public add(i: SCORMInteraction, insideAssessment: boolean) {
    try {
      // check the interaction type is valid
      let validType = false;
      Object.keys(SCORMInteractionType).forEach(key => {
        if (i.type === key) {
          validType = true;
        }
      });
      if (!validType) {
        throw new Error("Invalid interaction type - " + i.type);
      }

      // the interaction type must be either performance or true-false
      if (
        i.result !== SCORMInteractionResultType.CORRECT &&
        i.result !== SCORMInteractionResultType.WRONG &&
        i.result !== SCORMInteractionResultType.NEUTRAL
      ) {
        throw new Error(
          "Invalid interaction result.  Result must be set to correct, wrong or neutral."
        );
      }

      // !! passed validation checks so start setting the values !!
      let interactionsId = i.name;

      interactionsId = interactionsId.replace(/ /g, "_");

      // if the name/id passed in is over 255 characters in length (the SCORM limit) then truncate it.
      if (interactionsId.length > 255) {
        interactionsId = interactionsId.substring(0, 254);
      }

      const positionId = parseInt(
        this._getterSetter.getValue("cmi.interactions._count"),
        10
      );

      // the LMS doesn't support interactions
      if (!(positionId >= 0)) {
        return false;
      }

      // if the LMS supports objectives
      if (this._scormObjectivesAdapter.lmsSupportedElements.length > 0) {
        const o = this._scormObjectivesAdapter.createSCORMObjective();
        o.id = interactionsId;
        o.scoreMin = i.scoreMin;
        o.scoreMax = i.scoreMax;
        o.scoreRaw = i.scoreRaw;

        switch (i.result) {
          // only one pattern makes sense here, and the pattern is a single character or numeral.  Legal characters are 0,1,t and f.  O is false, 1 is true.
          // if the response is a complete word, e.g. true, only the first letter is taken as only that is significant
          // ELFH_TF
          case SCORMInteractionResultType.CORRECT:
            if (insideAssessment) {
              o.status = SCORMObjectiveStatus.PASSED;
            } else {
              o.status = SCORMObjectiveStatus.COMPLETED;
            }
            break;

          case SCORMInteractionResultType.WRONG:
            if (insideAssessment) {
              o.status = SCORMObjectiveStatus.FAILED;
            } else {
              o.status = SCORMObjectiveStatus.COMPLETED;
            }
            break;

          case SCORMInteractionResultType.NEUTRAL:
            o.status = SCORMObjectiveStatus.COMPLETED;
            break;

          default:
            o.status = SCORMObjectiveStatus.INCOMPLETE;
            break;
        }

        // add/update the objective to the LMS, specifically for and referencing this interaction
        // (later the objective is referenced by the interaction using the unique question id e.g. L1234), so it can used in reports
        this._scormObjectivesAdapter.add(o);

        // set the name of the objective within the interaction
        this._getterSetter.setValue(
          "cmi.interactions." + positionId + ".objectives.0.id",
          o.id
        );
      }

      // interactions id
      this._getterSetter.setValue(
        "cmi.interactions." + positionId + ".id",
        interactionsId
      );

      // type of question, either true-false or performance
      this._getterSetter.setValue(
        "cmi.interactions." + positionId + ".type",
        i.type
      );

      this._getterSetter.setValue(
        "cmi.interactions." + positionId + ".time",
        i.time
      );

      this._getterSetter.setValue(
        "cmi.interactions." + positionId + ".latency",
        i.latency
      );

      // interactions result
      this._getterSetter.setValue(
        "cmi.interactions." + positionId + ".result",
        i.result
      );

      this.setCorrectResponses(i, positionId);
    } catch (e) {
      throw new AdapterError("Unable to add interaction.", { cause: e });
    }
  }

  private setCorrectResponses(i: SCORMInteraction, positionId: number) {
    try {
      if (
        i.correctResponsePatterns != undefined &&
        i.correctResponsePatterns.length > 0
      ) {
        switch (i.type) {
          // only one pattern makes sense here, and the pattern is a single character or numeral.  Legal characters are 0,1,t and f.  O is false, 1 is true.
          // if the response is a complete word, e.g. true, only the first letter is taken as only that is significant
          // ELFH_TF
          case SCORMInteractionType.TRUE_FALSE:
            this.trueFalseRecordCorrectResponses(
              i.correctResponsePatterns,
              positionId
            );
            break;

          // each pattern is one character in each field of a comma delimited string.  More than one field is allowed.
          // Only single integers or letters (a-z) or both may be used in each field.
          // Each response is limited to only a single character.  If there are more that 26 possible value, then a performance
          // type response should be used instead.
          // ELFH_Radio, ELFH_Checkbox
          case SCORMInteractionType.CHOICE:
            this.choiceRecordCorrectResponses(
              i.correctResponsePatterns,
              positionId
            );
            break;

          case SCORMInteractionType.FILL_IN:
            // only the first correct response pattern is allowed for a fill in
            this._getterSetter.setValue(
              "cmi.interactions." + positionId + ".correct_responses.0.pattern",
              i.correctResponsePatterns[0]
            );
            break;

          // ELFH_True_False and ELFH_MRB
          case SCORMInteractionType.MATCHING:
            this._getterSetter.setValue(
              "cmi.interactions." + positionId + ".correct_responses.0.pattern",
              i.correctResponsePatterns.join(",")
            );
            break;

          case SCORMInteractionType.PERFORMANCE: // not supported yet
            break;

          case SCORMInteractionType.SEQUENCING:
            this._getterSetter.setValue(
              "cmi.interactions." + positionId + ".correct_responses.0.pattern",
              i.correctResponsePatterns.join(",")
            );
            break;

          case SCORMInteractionType.LIKERT:
            // there is no correct response for this question type, so the field should be left blank

            break;
          case SCORMInteractionType.NUMERIC: // not supported yet
            break;

          default:
            break;
        }
      }
    } catch (e) {
      throw new AdapterError(
        "Failed to record interaction correct response pattern",
        { cause: e }
      );
    }
  }

  private trueFalseRecordCorrectResponses(
    responses: Array<string>,
    positionId: number
  ) {
    if (responses.length > 1) {
      throw new Error(
        "Invalid number of correct responses for a true-false interaction type.  Only one correct response may be specified."
      );
    }

    let r = responses[0];
    r = r.substring(0, 1).toLowerCase();

    let recordableResponse = r;
    if (r == "t") {
      recordableResponse = "1";
    } else if (r == "f") {
      recordableResponse = "0";
    }

    if (recordableResponse !== "0" && recordableResponse !== "1") {
      throw new AdapterError(
        "Invalid response value for true-false interaction."
      );
    }

    this._getterSetter.setValue(
      "cmi.interactions." + positionId + ".correct_responses.0.pattern",
      recordableResponse
    );
  }

  private choiceRecordCorrectResponses(
    responses: Array<string>,
    positionId: number
  ) {
    for (let i = 0; i < responses.length; i++) {
      let recordableResponse = "";
      const recordableChoices = [];

      const r = responses[i];

      const choices = r.split(",");

      for (let i = 0; i < choices.length; i++) {
        if (choices[i].length > 0) {
          if (choices[i].length > 26) {
            throw new AdapterError(
              "More than 26 possible choices is NOT allowed in a choice type interaction.  A performance type should be used instead."
            );
          }

          // record the first character only
          recordableChoices.push(choices[i].substring(0, 1));
        } else {
          recordableChoices.push("");
        }
      }

      recordableResponse = recordableChoices.join(",");

      this._getterSetter.setValue(
        "cmi.interactions." +
          positionId +
          ".correct_responses." +
          i +
          ".pattern",
        recordableResponse
      );
    }
  }
}
