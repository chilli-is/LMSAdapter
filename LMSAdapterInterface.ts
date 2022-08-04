export default interface LMSAdapterInterface {
  coreLMSSupportedElements: string[];
  studentDataLMSSupportedElements: string[];

  studentName: string;
  studentId: string;
  totalTime: number;
  score: number;
  lastCommit: number;
}
