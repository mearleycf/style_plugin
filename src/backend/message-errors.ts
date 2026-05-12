import type { ZodError } from "zod";

type ZodErrorIssue = ZodError["issues"][number];

export function formatPluginMessageError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid plugin message";

  const [firstPath, editIndex, section, field, nestedField] = issue.path;

  if (firstPath === "width" || firstPath === "height") {
    if (issue.code === "invalid_type") {
      return "resize message must include numeric width and height";
    }
    if (issue.code === "too_small") {
      return "resize message width and height must be positive numbers";
    }
  }

  if (
    issue.code === "invalid_key" &&
    firstPath === "edits" &&
    typeof editIndex === "number" &&
    section === "varBindings" &&
    typeof field === "string"
  ) {
    return `Edit ${editIndex} includes unsupported variable binding field "${field}"`;
  }

  if (
    issue.code === "too_small" &&
    firstPath === "edits" &&
    typeof editIndex === "number" &&
    section === "changes" &&
    typeof field === "string"
  ) {
    return formatChangeRangeError(issue, editIndex, field, nestedField);
  }

  return "Invalid plugin message";
}

function formatChangeRangeError(
  issue: ZodErrorIssue,
  editIndex: number,
  field: string,
  nestedField: PropertyKey | undefined,
): string {
  if (field === "lineHeight" && nestedField === "value") {
    return `Edit ${editIndex} lineHeight value must be greater than 0`;
  }

  if (issue.code === "too_small" && !issue.inclusive) {
    return `Edit ${editIndex} ${field} must be greater than 0`;
  }

  return `Edit ${editIndex} ${field} must be greater than or equal to 0`;
}
