export type FixtureDocument = {
  id: string;
  title: string;
  filename: string;
  summary: string;
  tags: string[];
  body: string;
};

export type AskSource = {
  id: string | null;
  title: string;
  url: string;
  snippet: string;
  datasource: string | null;
};

export type IngestResult = {
  datasource: string;
  indexedCount: number;
  documentIds: string[];
  documentTitles: string[];
  processingTriggered: boolean;
  processingMessage: string;
};

export type AskQuestionResult = {
  question: string;
  datasource: string;
  answer: string;
  sources: AskSource[];
  searchRequestId: string | null;
};
