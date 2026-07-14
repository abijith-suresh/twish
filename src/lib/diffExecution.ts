import {
  createDiffRows,
  DIFF_CONTEXT,
  filterRowsWithContext,
  getChangeSourceIndices,
  getDiffStats,
} from "./diff";
import type { DiffAnalysisInput, DiffAnalysisResult } from "./diffAnalysis";

export const DIFF_WORKER_THRESHOLD_CHARS = 75_000;
const WORKER_TIMEOUT_MS = 10_000;
const STRUCTURED_COMPARE_LANGUAGES = new Set<
  Pick<DiffAnalysisInput, "leftLanguage">["leftLanguage"]
>(["json", "toml", "yaml", "env"]);

export interface DiffExecutionRequest {
  requestId: number;
  input: DiffAnalysisInput;
}

export interface DiffExecutionResponse {
  requestId: number;
  result: DiffAnalysisResult;
  mode: "sync" | "worker";
}

interface WorkerLike {
  onerror: ((event: ErrorEvent) => void) | null;
  onmessage: ((event: MessageEvent<DiffExecutionResponse>) => void) | null;
  postMessage: (message: DiffExecutionRequest) => void;
  terminate: () => void;
}

interface PendingWorkerRequest {
  input: DiffAnalysisInput;
  requestId: number;
  resolve: (response: DiffExecutionResponse) => void;
}

export interface DiffAnalysisExecutor {
  dispose: () => void;
  execute: (input: DiffAnalysisInput) => Promise<DiffExecutionResponse>;
}

export interface DiffAnalysisExecutorOptions {
  createWorker?: () => WorkerLike | null;
  syncExecutor?: (input: DiffAnalysisInput) => DiffAnalysisResult | Promise<DiffAnalysisResult>;
  workerThresholdChars?: number;
}

export function shouldUseDiffWorker(
  input: Pick<DiffAnalysisInput, "original" | "modified">,
  threshold = DIFF_WORKER_THRESHOLD_CHARS
): boolean {
  return input.original.length + input.modified.length >= threshold;
}

export function shouldUseStructuredCompareWorker(
  input: Pick<DiffAnalysisInput, "leftLanguage" | "rightLanguage">
): boolean {
  return (
    input.leftLanguage === input.rightLanguage &&
    STRUCTURED_COMPARE_LANGUAGES.has(input.leftLanguage)
  );
}

function analyzePlainTextDiff(input: DiffAnalysisInput): DiffAnalysisResult {
  const rows = createDiffRows(input.original, input.modified);
  const filteredRows = filterRowsWithContext(
    rows,
    input.changesOnly,
    input.context ?? DIFF_CONTEXT
  );
  const stats = getDiffStats(rows);

  return {
    strategy: "text",
    errors: [],
    rows,
    filteredRows,
    stats,
    changeIndices: getChangeSourceIndices(rows),
    isIdentical: stats.added === 0 && stats.removed === 0,
  };
}

function createBrowserWorker(): WorkerLike | null {
  if (typeof Worker === "undefined") {
    return null;
  }

  return new Worker(new URL("./diff.worker.ts", import.meta.url), {
    type: "module",
  });
}

export function createDiffAnalysisExecutor(
  options: DiffAnalysisExecutorOptions = {}
): DiffAnalysisExecutor {
  const syncExecutor =
    options.syncExecutor ??
    (async (input: DiffAnalysisInput) => {
      const { analyzeDiff } = await import("./diffAnalysis");
      return analyzeDiff(input);
    });
  const createWorker = options.createWorker ?? createBrowserWorker;
  const workerThresholdChars = options.workerThresholdChars ?? DIFF_WORKER_THRESHOLD_CHARS;

  let nextRequestId = 0;
  let worker: WorkerLike | null = null;
  const pendingRequests = new Map<number, PendingWorkerRequest>();

  function createTextSyncResponse(
    requestId: number,
    input: DiffAnalysisInput
  ): DiffExecutionResponse {
    return {
      requestId,
      result: analyzePlainTextDiff(input),
      mode: "sync",
    };
  }

  async function createFullSyncResponse(
    requestId: number,
    input: DiffAnalysisInput
  ): Promise<DiffExecutionResponse> {
    return {
      requestId,
      result: await syncExecutor(input),
      mode: "sync",
    };
  }

  function resolvePendingWithSyncFallback(): void {
    const queuedRequests = Array.from(pendingRequests.values());
    pendingRequests.clear();

    for (const request of queuedRequests) {
      void createFullSyncResponse(request.requestId, request.input).then(request.resolve);
    }
  }

  function disposeWorker(): void {
    worker?.terminate();
    worker = null;
  }

  function getWorker(): WorkerLike | null {
    if (worker) {
      return worker;
    }

    try {
      worker = createWorker();
    } catch {
      worker = null;
    }

    if (!worker) {
      return null;
    }

    worker.onmessage = (event) => {
      const response = event.data;
      const pendingRequest = pendingRequests.get(response.requestId);

      if (!pendingRequest) {
        return;
      }

      pendingRequests.delete(response.requestId);
      pendingRequest.resolve({ ...response, mode: "worker" });
    };

    worker.onerror = () => {
      disposeWorker();
      resolvePendingWithSyncFallback();
    };

    return worker;
  }

  return {
    dispose() {
      disposeWorker();
      resolvePendingWithSyncFallback();
    },
    execute(input) {
      const requestId = ++nextRequestId;
      const needsWorker =
        shouldUseStructuredCompareWorker(input) || shouldUseDiffWorker(input, workerThresholdChars);

      if (!needsWorker) {
        return Promise.resolve(createTextSyncResponse(requestId, input));
      }

      const activeWorker = getWorker();

      if (!activeWorker) {
        return createFullSyncResponse(requestId, input);
      }

      return new Promise((resolve) => {
        pendingRequests.set(requestId, { input, requestId, resolve });

        const timeoutId = setTimeout(() => {
          if (pendingRequests.has(requestId)) {
            pendingRequests.delete(requestId);
            void createFullSyncResponse(requestId, input).then(resolve);
          }
        }, WORKER_TIMEOUT_MS);

        try {
          activeWorker.postMessage({ requestId, input });
        } catch {
          clearTimeout(timeoutId);
          pendingRequests.delete(requestId);
          disposeWorker();
          void createFullSyncResponse(requestId, input).then(resolve);
        }
      });
    },
  };
}
