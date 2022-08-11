import { DataResponse, List, Problem, ProblemStatus, ProblemData } from "./luogu-api";
export type ProblemsListResult = DataResponse<{ problems: List<Problem & ProblemStatus>; page: number; }>;
export type ProblemResult = DataResponse<ProblemData>;