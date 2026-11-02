/** Assessed academic orders buy guidance; non-assessed orders may buy software. */
export const ACADEMIC_SCOPE = "mentoring" as const;

export type AcademicOrderInput = {
  projectType: string;
  serviceScope?: unknown;
  assessmentUse?: unknown;
  studentAuthored?: unknown;
  integrityAcknowledged?: unknown;
  featureIds?: unknown;
  text?: unknown[];
};

// This catches explicit outsourcing requests. The fixed mentoring scope and delivery
// restrictions are the primary controls; wording checks are only an extra backstop.
const COMPLETION_REQUEST = /(?:write|build|make|complete|prepare|deliver|do)\s+(?:my|our|the|a|an)?\s*(?:whole|entire|complete|final[- ]year|mini|major)?\s*(?:project|assignment|assessment|report|presentation|slides|ppt|viva|thesis|dissertation)\s*(?:for me|for us|to submit|for submission|on my behalf)|(?:ready[- ]to[- ]submit|submit (?:it|this|your work) as (?:mine|my own)|do (?:my|our) assignment)/i;
const ACADEMIC_CONTEXT = /(?:final[- ]year|mini[- ]project|major[- ]project|college assignment|coursework|academic submission|viva)/i;

export function validateAcademicOrder(input: AcademicOrderInput): string | null {
  if (input.assessmentUse !== "yes" && input.assessmentUse !== "no") return "Tell us whether this relates to assessed work.";
  if (input.integrityAcknowledged !== true) return "Acknowledge the academic-integrity terms before payment.";
  if (!Array.isArray(input.text) || input.text.some((value) => typeof value !== "string")) return "Invalid project request.";
  if (input.projectType !== "academic") {
    if (input.assessmentUse === "yes" || input.text.some((value) => COMPLETION_REQUEST.test(value as string) || ACADEMIC_CONTEXT.test(value as string))) {
      return "Assessed student work can only receive mentoring. Choose project mentoring instead.";
    }
    if (input.serviceScope !== "custom_software") return "Personal and business requests must be custom software.";
    return null;
  }
  if (input.assessmentUse === "no" && input.serviceScope === "custom_software") {
    if (input.studentAuthored !== true) return "Confirm this software is not for assessed work and will not be submitted for assessment.";
    if (input.text.some((value) => COMPLETION_REQUEST.test(value as string) || ACADEMIC_CONTEXT.test(value as string))) {
      return "Assessed student work can only receive mentoring. Choose project mentoring instead.";
    }
    if (!Array.isArray(input.featureIds) || input.featureIds.some((id) => typeof id !== "string")) return "Invalid feature selection.";
    return null;
  }
  if (input.serviceScope !== ACADEMIC_SCOPE) return "Academic requests for assessed work must be for project mentoring.";
  if (input.studentAuthored !== true) return "Confirm that you will author any assessed work yourself.";
  if (!Array.isArray(input.featureIds) || input.featureIds.length !== 0) return "Implementation and document packages are unavailable for academic mentoring.";
  if (input.text.some((value) => COMPLETION_REQUEST.test(value as string))) return "We cannot complete assessed work or presentation materials for you. Request guidance on your own work instead.";
  return null;
}
