import AdapterError from "./AdapterError";
import { SCORMObjectiveStatus } from "./SCORMConstants";
import SCORMGetterSetter from "./SCORMGetterSetter";
import SCORMObjective from "./SCORMObjective";

export default class SCORMObjectivesAdapter {
  private _api: any;
  private _getterSetter: SCORMGetterSetter;
  public lmsSupportedElements = new Array<string>();
  public objectives = new Map();

  constructor(api: any, getterSetter: SCORMGetterSetter) {
    this._api = api;
    this._getterSetter = getterSetter;
    try {
      const children = this._getterSetter.getValue(
        "cmi.interactions._children"
      ); // get LMS supported elements

      if (children != null && children.length > 0) {
        this.lmsSupportedElements = children.split(",");
        const objectivesCount = this._getterSetter.getValue(
          "cmi.objectives._count"
        );

        // if there are objectives set in the LMS, pull them back and populate the SCO,
        // so that if any new or existing objectives are attempted, we don't overwrite the old data
        if (objectivesCount > 0) {
          for (let i = 0; i < objectivesCount.length; i++) {
            const o = this.createSCORMObjective();
            o.id = this._getterSetter.getValue("cmi.objectives." + i + ".id");
            o.status = this._getterSetter.getValue(
              "cmi.objectives." + i + ".status"
            );
            o.scoreMin = this._getterSetter.getValue(
              "cmi.objectives." + i + ".score.min"
            );
            o.scoreMax = this._getterSetter.getValue(
              "cmi.objectives." + i + ".score.max"
            );
            o.scoreRaw = this._getterSetter.getValue(
              "cmi.objectives." + i + ".score.raw"
            );

            this.objectives.set(i, o);
          }
        }
      }
    } catch (e) {
      throw new AdapterError(
        "Unable to get supported elements (objectives._children) from LMS",
        { cause: e }
      );
    }
  }

  public createSCORMObjective(): SCORMObjective {
    const i = new SCORMObjective();
    return i;
  }

  // Objective object:
  // id
  // status - passed, completed, failed, incomplete, browsed, not attempted
  // scoreMin
  // scoreMax
  // scoreRaw
  public add(objective: SCORMObjective) {
    if (this.lmsSupportedElements.length > 0) {
      try {
        if (
          objective.status !== SCORMObjectiveStatus.PASSED &&
          objective.status !== SCORMObjectiveStatus.COMPLETED &&
          objective.status !== SCORMObjectiveStatus.FAILED &&
          objective.status !== SCORMObjectiveStatus.INCOMPLETE &&
          objective.status !== SCORMObjectiveStatus.BROWSED &&
          objective.status !== SCORMObjectiveStatus.NOT_ATTEMPTED
        ) {
          throw new Error(
            "Unrecognised objective status - " + objective.status
          );
        }

        let objectiveIndex = -1;

        // if an objective with this id doesn't already exist, create one
        // else update the existing one
        this.objectives.forEach((value, key) => {
          if (value.id == objective.id) {
            objectiveIndex = key;
          }
        });

        // create new objective
        if (objectiveIndex == -1) {
          objectiveIndex = parseInt(
            this._getterSetter.getValue("cmi.objectives._count"),
            10
          );
          this.objectives.set(objectiveIndex, objective); // add new objective to this objects internal map, to keep track of it.
        }

        this._getterSetter.setValue(
          "cmi.objectives." + objectiveIndex + ".id",
          objective.id
        );
        this._getterSetter.setValue(
          "cmi.objectives." + objectiveIndex + ".status",
          objective.status
        );
        this._getterSetter.setValue(
          "cmi.objectives." + objectiveIndex + ".score.min",
          objective.scoreMin.toString()
        );
        this._getterSetter.setValue(
          "cmi.objectives." + objectiveIndex + ".score.max",
          objective.scoreMax.toString()
        );
        this._getterSetter.setValue(
          "cmi.objectives." + objectiveIndex + ".score.raw",
          objective.scoreRaw.toString()
        );
      } catch (e) {
        throw new AdapterError("Error adding objective", { cause: e });
      }
    }
  }
}
