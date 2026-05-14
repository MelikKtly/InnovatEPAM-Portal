import { getDb, type IdeaWithSubmitterAndScores } from "@/lib/db";

const BASE_SELECT = `
  SELECT
    i.*,
    u.email AS submitter_email,
    e.impact_score      AS impact_score,
    e.feasibility_score AS feasibility_score,
    e.innovation_score  AS innovation_score,
    CASE
      WHEN e.impact_score IS NOT NULL
       AND e.feasibility_score IS NOT NULL
       AND e.innovation_score IS NOT NULL
      THEN (e.impact_score + e.feasibility_score + e.innovation_score) / 3.0
      ELSE NULL
    END AS avg_score
  FROM ideas i
  JOIN users u ON u.id = i.submitter_id
  LEFT JOIN evaluations e ON e.id = (
    SELECT id FROM evaluations
    WHERE idea_id = i.id
    ORDER BY created_at DESC
    LIMIT 1
  )
`;

export function fetchAllIdeas(): IdeaWithSubmitterAndScores[] {
  return getDb()
    .prepare(`${BASE_SELECT} ORDER BY i.created_at DESC`)
    .all() as IdeaWithSubmitterAndScores[];
}

export function fetchIdeasForSubmitter(
  submitterId: number,
): IdeaWithSubmitterAndScores[] {
  return getDb()
    .prepare(
      `${BASE_SELECT} WHERE i.submitter_id = ? ORDER BY i.created_at DESC`,
    )
    .all(submitterId) as IdeaWithSubmitterAndScores[];
}

export function fetchIdeaById(
  ideaId: number,
): IdeaWithSubmitterAndScores | undefined {
  return getDb()
    .prepare(`${BASE_SELECT} WHERE i.id = ?`)
    .get(ideaId) as IdeaWithSubmitterAndScores | undefined;
}
