import { orderBy, type Unsubscribe } from "firebase/firestore";
import type { Pipeline, PipelineStage } from "@/lib/types";
import {
  COLLECTIONS,
  createRecord,
  deleteRecord,
  listRecords,
  subscribeRecords,
  updateRecord,
} from "./base";
import { logActivity, type Actor } from "./activities";
import { DEFAULT_STAGES } from "./orgs";

export function subscribePipelines(
  orgId: string,
  onData: (rows: Pipeline[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return subscribeRecords<Pipeline>(COLLECTIONS.pipelines, orgId, [orderBy("createdAt", "asc")], onData, onError);
}

export function listPipelines(orgId: string) {
  return listRecords<Pipeline>(COLLECTIONS.pipelines, orgId, [orderBy("createdAt", "asc")]);
}

export async function createPipeline(
  orgId: string,
  actor: Actor,
  name: string,
  stages: PipelineStage[] = DEFAULT_STAGES,
  isDefault = false,
): Promise<string> {
  const id = await createRecord(COLLECTIONS.pipelines, orgId, actor.id, { name, stages, isDefault });
  await logActivity(orgId, actor, { type: "created", summary: `created the ${name} pipeline` });
  return id;
}

export async function updatePipeline(
  orgId: string,
  actor: Actor,
  pipeline: Pipeline,
  patch: Partial<Pick<Pipeline, "name" | "stages" | "isDefault">>,
): Promise<void> {
  await updateRecord(COLLECTIONS.pipelines, pipeline.id, patch);
  await logActivity(orgId, actor, {
    type: "updated",
    summary: `updated the ${patch.name ?? pipeline.name} pipeline`,
  });
}

export async function deletePipeline(orgId: string, actor: Actor, pipeline: Pipeline): Promise<void> {
  await deleteRecord(COLLECTIONS.pipelines, pipeline.id);
  await logActivity(orgId, actor, { type: "deleted", summary: `deleted the ${pipeline.name} pipeline` });
}

/** Ensures a workspace always has at least one pipeline to drop deals into. */
export async function ensureDefaultPipeline(orgId: string, actor: Actor): Promise<Pipeline[]> {
  const existing = await listPipelines(orgId);
  if (existing.length) return existing;
  await createPipeline(orgId, actor, "Sales pipeline", DEFAULT_STAGES, true);
  return listPipelines(orgId);
}

export function stageById(pipeline: Pipeline | null, stageId: string): PipelineStage | null {
  return pipeline?.stages.find((stage) => stage.id === stageId) ?? null;
}

export function newStage(name: string): PipelineStage {
  return {
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    probability: 50,
    color: "#6366f1",
  };
}
