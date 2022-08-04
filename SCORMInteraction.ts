import {
  SCORMInteractionResultType,
  SCORMInteractionType
} from "./SCORMConstants";

export default class SCORMInteraction {
  public name = "";
  public time = "";
  public latency = "";
  public type = SCORMInteractionType.CHOICE;
  public result = SCORMInteractionResultType.NEUTRAL;
  public scoreRaw = 0;
  public scoreMin = 0;
  public scoreMax = 0;
  public correctResponsePatterns = new Array<string>();
  public studentResponse = new Array<string>();
}
