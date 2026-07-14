import { analyzeDiff } from "./diffAnalysis";
import type { DiffExecutionRequest, DiffExecutionResponse } from "./diffExecution";

self.onmessage = (event: MessageEvent<DiffExecutionRequest>) => {
  const response: DiffExecutionResponse = {
    requestId: event.data.requestId,
    result: analyzeDiff(event.data.input),
    mode: "worker",
  };

  self.postMessage(response);
};
