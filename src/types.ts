export type AskQuestionResult = {
  answer: string;
  datasource: string;
  question: string;
  searchRequestId: string | null;
  sources: AskSource[];
};

export type AskSource = {
  datasource: string | null;
  id: string | null;
  snippet: string;
  title: string;
  url: string;
};

export type FixtureDocument = {
  body: string;
  filename: string;
  id: string;
  summary: string;
  tags: string[];
  title: string;
};

export type IngestResult = {
  datasource: string;
  documentIds: string[];
  documentTitles: string[];
  indexedCount: number;
};
