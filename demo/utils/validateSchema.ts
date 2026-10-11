const supportedFieldTypes = new Set([
  "text",
  "email",
  "password",
  "url",
  "tel",
  "search",
  "number",
  "integer",
  "select",
  "multiselect",
  "radio",
  "checkboxgroup",
  "checkboxcard",
  "radiocard",
  "segmented",
  "boolean",
  "switch",
  "checkbox",
  "date",
  "time",
  "datetime",
  "textarea",
  "file",
  "color",
  "slider",
  "hidden",
  "pin",
  "rating",
  "editable",
  "tags",
  "array",
  "object",
  "custom",
]);

const conditionOperators = new Set([
  "eq",
  "ne",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "nin",
  "contains",
  "startsWith",
  "endsWith",
  "matches",
  "empty",
  "notEmpty",
  "truthy",
  "falsy",
]);

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateOption(option: unknown, path: string): string | null {
  if (!isRecord(option)) return `${path} must be an object.`;
  if (!["string", "number", "boolean"].includes(typeof option.value)) {
    return `${path}.value must be a string, number, or boolean.`;
  }
  if (typeof option.value === "number" && !Number.isFinite(option.value)) {
    return `${path}.value must be finite.`;
  }
  if (typeof option.label !== "string") {
    return `${path}.label must be a string.`;
  }
  if (option.disabled !== undefined && typeof option.disabled !== "boolean") {
    return `${path}.disabled must be a boolean.`;
  }
  if (
    option.description !== undefined &&
    typeof option.description !== "string"
  ) {
    return `${path}.description must be a string.`;
  }
  return null;
}

function validateOptions(value: unknown, path: string): string | null {
  if (!Array.isArray(value)) return `${path} must be an array.`;
  for (const [index, option] of value.entries()) {
    const error = validateOption(option, `${path}[${index}]`);
    if (error) return error;
  }
  return null;
}

function validateCondition(value: unknown, path: string): string | null {
  if (!isRecord(value)) return `${path} must be a condition object.`;

  const compoundKeys = ["all", "any", "not"].filter((key) =>
    Object.prototype.hasOwnProperty.call(value, key),
  );

  if (compoundKeys.length > 0) {
    if (compoundKeys.length !== 1) {
      return `${path} must contain only one of "all", "any", or "not".`;
    }

    const key = compoundKeys[0];

    if (key === "not") {
      return validateCondition(value.not, `${path}.not`);
    }

    const conditions = value[key];
    if (!Array.isArray(conditions)) {
      return `${path}.${key} must be an array.`;
    }

    for (const [index, condition] of conditions.entries()) {
      const error = validateCondition(condition, `${path}.${key}[${index}]`);
      if (error) return error;
    }
    return null;
  }

  if (!isNonEmptyString(value.field)) {
    return `${path}.field must be a non-empty string.`;
  }

  if (
    value.operator !== undefined &&
    (typeof value.operator !== "string" ||
      !conditionOperators.has(value.operator))
  ) {
    return `${path}.operator is not supported.`;
  }

  if (value.operator === "matches" && typeof value.value === "string") {
    try {
      new RegExp(value.value);
    } catch {
      return `${path}.value must be a valid regular expression.`;
    }
  }

  return null;
}

function validateRuleValue(
  value: unknown,
  path: string,
  expected: "number" | "string",
): string | null {
  let ruleValue = value;

  if (isRecord(value)) {
    if (!Object.prototype.hasOwnProperty.call(value, "value")) {
      return `${path}.value is required.`;
    }
    if (value.message !== undefined && typeof value.message !== "string") {
      return `${path}.message must be a string.`;
    }
    ruleValue = value.value;
  }

  if (expected === "number" && !isFiniteNumber(ruleValue)) {
    return `${path} must contain a finite number.`;
  }

  if (expected === "string" && typeof ruleValue !== "string") {
    return `${path} must contain a string.`;
  }

  if (path.endsWith(".pattern") && typeof ruleValue === "string") {
    try {
      new RegExp(ruleValue);
    } catch {
      return `${path} must contain a valid regular expression.`;
    }
  }

  return null;
}

function validateValidation(value: unknown, path: string): string | null {
  if (!isRecord(value)) return `${path} must be an object.`;

  if (
    value.required !== undefined &&
    typeof value.required !== "boolean" &&
    typeof value.required !== "string"
  ) {
    return `${path}.required must be a boolean or string.`;
  }

  for (const key of ["min", "max", "minLength", "maxLength"]) {
    if (value[key] !== undefined) {
      const error = validateRuleValue(value[key], `${path}.${key}`, "number");
      if (error) return error;
    }
  }

  if (value.pattern !== undefined) {
    const error = validateRuleValue(value.pattern, `${path}.pattern`, "string");
    if (error) return error;
  }

  if (value.validate !== undefined && !isRecord(value.validate)) {
    // Static JSON cannot contain validator functions. String messages
    // are supported by Hookra's schema contract.
    if (typeof value.validate !== "string") {
      return `${path}.validate must be an object or string in JSON schemas.`;
    }
  }

  return null;
}

function validateField(field: unknown, path: string): string | null {
  if (!isRecord(field)) return `${path} must be an object.`;

  if (!isNonEmptyString(field.name)) {
    return `${path}.name must be a non-empty string.`;
  }

  if (typeof field.type !== "string" || !supportedFieldTypes.has(field.type)) {
    return `${path}.type must be a supported Hookra field type.`;
  }

  if (field.label !== undefined && typeof field.label !== "string") {
    return `${path}.label must be a string.`;
  }

  for (const key of ["description", "placeholder"]) {
    if (field[key] !== undefined && typeof field[key] !== "string") {
      return `${path}.${key} must be a string.`;
    }
  }

  for (const key of ["required", "disabled", "readOnly", "hidden"]) {
    if (
      field[key] !== undefined &&
      typeof field[key] !== "boolean" &&
      !(key === "required" && typeof field[key] === "string")
    ) {
      return `${path}.${key} has an invalid type.`;
    }
  }

  if (field.validation !== undefined) {
    const error = validateValidation(field.validation, `${path}.validation`);
    if (error) return error;
  }

  if (field.dependsOn !== undefined) {
    const error = validateCondition(field.dependsOn, `${path}.dependsOn`);
    if (error) return error;
  }

  if (field.options !== undefined) {
    const error = validateOptions(field.options, `${path}.options`);
    if (error) return error;
  }

  if (field.optionsFrom !== undefined) {
    const optionsFrom = field.optionsFrom;
    if (!isRecord(optionsFrom)) {
      return `${path}.optionsFrom must be an object.`;
    }
    if (!isNonEmptyString(optionsFrom.field)) {
      return `${path}.optionsFrom.field must be a non-empty string.`;
    }
    if (!isRecord(optionsFrom.map)) {
      return `${path}.optionsFrom.map must be an object.`;
    }

    for (const [key, options] of Object.entries(optionsFrom.map)) {
      const error = validateOptions(options, `${path}.optionsFrom.map.${key}`);
      if (error) return error;
    }

    if (optionsFrom.default !== undefined) {
      const error = validateOptions(
        optionsFrom.default,
        `${path}.optionsFrom.default`,
      );
      if (error) return error;
    }
  }

  if (field.fillFrom !== undefined) {
    if (!isRecord(field.fillFrom)) {
      return `${path}.fillFrom must be an object.`;
    }
    if (!isNonEmptyString(field.fillFrom.trigger)) {
      return `${path}.fillFrom.trigger must be a non-empty string.`;
    }
    if (
      field.fillFrom.targets !== undefined &&
      field.fillFrom.targets !== "*" &&
      (!Array.isArray(field.fillFrom.targets) ||
        !field.fillFrom.targets.every(isNonEmptyString))
    ) {
      return `${path}.fillFrom.targets must be "*" or an array of non-empty strings.`;
    }
    if (
      field.fillFrom.debounce !== undefined &&
      (!isFiniteNumber(field.fillFrom.debounce) || field.fillFrom.debounce < 0)
    ) {
      return `${path}.fillFrom.debounce must be a non-negative number.`;
    }
  }

  if (field.type === "object") {
    if (!Array.isArray(field.fields)) {
      return `${path}.fields must be an array for an object field.`;
    }
    for (const [index, nested] of field.fields.entries()) {
      const error = validateField(nested, `${path}.fields[${index}]`);
      if (error) return error;
    }
  }

  if (field.type === "array") {
    if (!isRecord(field.itemSchema)) {
      return `${path}.itemSchema must be a field object.`;
    }
    const error = validateField(field.itemSchema, `${path}.itemSchema`);
    if (error) return error;
  }

  
  // Reject nested-object properties on non-object fields.
  if (field.fields !== undefined && field.type !== 'object') {
    return `${path}.fields is only valid for object fields.`
  }

  // Reject array-item schemas on non-array fields.
  if (field.itemSchema !== undefined && field.type !== 'array') {
    return `${path}.itemSchema is only valid for array fields.`
  }

  if (
    field.type === "hidden" &&
    !Object.prototype.hasOwnProperty.call(field, "defaultValue")
  ) {
    return `${path}.defaultValue is required for hidden fields.`;
  }

  const numericPropertiesByType: Record<string, string[]> = {
    number: ["min", "max", "step", "precision"],
    integer: ["min", "max", "step", "precision"],
    slider: ["min", "max", "step"],
    multiselect: ["min", "max"],
    tags: ["max"],
    array: ["minItems", "maxItems"],
    file: ["maxSize"],
    pin: ["length"],
    rating: ["count"],
    textarea: ["maxLength"],
  };

  for (const key of numericPropertiesByType[field.type] ?? []) {
    if (field[key] !== undefined && !isFiniteNumber(field[key])) {
      return `${path}.${key} must be a finite number.`;
    }
  }

  if (
    ["date", "time", "datetime"].includes(field.type) &&
    ["min", "max"].some(
      (key) => field[key] !== undefined && typeof field[key] !== "string",
    )
  ) {
    return `${path}.min and ${path}.max must be strings for date/time fields.`;
  }

  if (field.width !== undefined) {
    const validWidths = [
      "full",
      "half",
      "third",
      "quarter",
      "two-thirds",
      "three-quarters",
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
    ];
    if (!validWidths.includes(field.width as string | number)) {
      return `${path}.width is invalid.`;
    }
  }

  if (field.props !== undefined && !isRecord(field.props)) {
    return `${path}.props must be an object.`;
  }

  return null;
}

export function validateSchema(value: unknown): string | null {
  if (!isRecord(value)) return "Schema must be a JSON object.";

  const fields = value.fields;
  const sections = value.sections;

  const hasFields = Array.isArray(fields);
  const hasSections = Array.isArray(sections);

  if (hasFields === hasSections) {
    return 'Schema must contain exactly one of "fields" or "sections" as an array.';
  }

  if (value.title !== undefined && typeof value.title !== "string") {
    return "title must be a string.";
  }
  if (
    value.description !== undefined &&
    typeof value.description !== "string"
  ) {
    return "description must be a string.";
  }
  if (
    value.submitLabel !== undefined &&
    typeof value.submitLabel !== "string"
  ) {
    return "submitLabel must be a string.";
  }
  if (value.resetLabel !== undefined && typeof value.resetLabel !== "string") {
    return "resetLabel must be a string.";
  }
  if (value.showReset !== undefined && typeof value.showReset !== "boolean") {
    return "showReset must be a boolean.";
  }

  if (value.layout !== undefined) {
    if (!isRecord(value.layout)) return "layout must be an object.";
    if (
      value.layout.columns !== undefined &&
      (!Number.isInteger(value.layout.columns) ||
        (value.layout.columns as number) < 1)
    ) {
      return "layout.columns must be a positive integer.";
    }
  }

  if (hasFields) {
    for (const [index, field] of fields.entries()) {
      const error = validateField(field, `fields[${index}]`);
      if (error) return error;
    }
  }

  if (hasSections) {
    for (const [index, section] of sections.entries()) {
      const path = `sections[${index}]`;

      if (!isRecord(section)) {
        return `${path} must be an object.`;
      }

      if (!Array.isArray(section.fields)) {
        return `${path}.fields must be an array.`;
      }

      if (section.dependsOn !== undefined) {
        const error = validateCondition(section.dependsOn, `${path}.dependsOn`);
        if (error) return error;
      }

      if (
        section.columns !== undefined &&
        (!Number.isInteger(section.columns) || (section.columns as number) < 1)
      ) {
        return `${path}.columns must be a positive integer.`;
      }

      for (const key of ["title", "description"]) {
        if (section[key] !== undefined && typeof section[key] !== "string") {
          return `${path}.${key} must be a string.`;
        }
      }

      for (const key of ["collapsible", "defaultCollapsed"]) {
        if (section[key] !== undefined && typeof section[key] !== "boolean") {
          return `${path}.${key} must be a boolean.`;
        }
      }

      for (const [fieldIndex, field] of section.fields.entries()) {
        const error = validateField(field, `${path}.fields[${fieldIndex}]`);
        if (error) return error;
      }
    }
  }

  return null;
}
