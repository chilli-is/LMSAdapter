import {
  SCORMObjectiveStatus
} from "./SCORMConstants";

export default class SCORMObjective {
  public id = "";
  public status = SCORMObjectiveStatus.NOT_ATTEMPTED;
  public scoreMin = 0;
  public scoreMax = 0;
  public scoreRaw = 0;
}
