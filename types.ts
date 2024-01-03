import exp from "constants";

// types.ts
export interface Job {
  ID: string;
  JSON: string;
}

export interface EmployeeNames {
  ID: string;
  JSON: string;
  category: string;
}

export interface EmployeeNotes {
  ID: string;
  JSON: string;
  category: string;
}

export interface Settings {
  ID: string;
  JSON: string;
  category: string;
}

export interface TakeoffMatrixs {
  ID: string;
  __KEY__: string;
  dataField: string;
  header: string;
  offset: string;
}

export interface Tasks {
  ID: string;
  JSON: string;
  category: string;
}
