export enum SCORMLessonStatus {
  FAILED = "failed",
  PASSED = "passed",
  COMPLETED = "completed",
  INCOMPLETE = "incomplete",
  NOT_ATTEMPTED = "not attempted",
  AB_INITIO = "ab-initio",
  BROWSED = "browsed"
}

export enum SCORMExitStatus {
  SUSPEND = "suspend",
  LOGOUT = "logout"
}

export enum SCORMInteractionType {
  TRUE_FALSE = "true-false",
  CHOICE = "choice",
  FILL_IN = "fill-in",
  MATCHING = "matching",
  PERFORMANCE = "performance",
  SEQUENCING = "sequencing",
  LIKERT = "likert",
  NUMERIC = "numeric"
}

export enum SCORMInteractionResultType {
  CORRECT = "correct",
  WRONG = "wrong",
  UNANTICIPATED = "unanticipated",
  NEUTRAL = "neutral"
}

export enum SCORMObjectiveStatus {
  PASSED = "passed",
  COMPLETED = "completed",
  FAILED = "failed",
  INCOMPLETE = "incomplete",
  BROWSED = "browsed",
  NOT_ATTEMPTED = "not attempted"
}
