import type { ContentType } from "@/lib/taxonomy";
import { TYPE_FIELDS, type FieldDescriptor } from "@/lib/admin/field-schema";
import { labelClass, inputClass, helpClass, errorClass } from "./styles";

/**
 * Renders a post type's metadata fields from the TYPE_FIELDS descriptors — the
 * same source the server parser validates against. Uncontrolled inputs
 * (defaultValue): the parent form reads them from the DOM on submit.
 */

interface MetaFormProps {
  type: ContentType;
  values: Record<string, unknown>;
  errors?: Record<string, string>;
}

/** Serializes a stored object-array field back to "a | b" lines for editing. */
function linesToText(name: string, value: unknown): string {
  const rows = Array.isArray(value) ? value : [];
  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      if (name === "installCommands") return `${r.platform} | ${r.command}`;
      if (name === "cheatsheet") return `${r.command} | ${r.description ?? ""}`;
      if (name === "downloads")
        return `${r.label} | ${r.url} | ${r.format ?? ""} | ${r.sizeBytes ?? 0}`;
      return "";
    })
    .join("\n");
}

function Field({
  field,
  value,
  error,
}: {
  field: FieldDescriptor;
  value: unknown;
  error?: string;
}) {
  const id = `field-${field.name}`;
  const label = (
    <label htmlFor={id} className={labelClass}>
      {field.label}
      {field.required && <span className="text-crit"> *</span>}
    </label>
  );

  let control: React.ReactNode;
  switch (field.kind) {
    case "checkbox":
      control = (
        <label className="mt-1 flex items-center gap-2 text-sm text-foreground">
          <input
            id={id}
            name={field.name}
            type="checkbox"
            defaultChecked={Boolean(value)}
            className="h-4 w-4 accent-accent"
          />
          <span className="text-muted">{field.help}</span>
        </label>
      );
      break;

    case "select":
      control = (
        <select
          id={id}
          name={field.name}
          defaultValue={String(value ?? "")}
          className={inputClass}
        >
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;

    case "multiselect": {
      const selected = new Set(
        Array.isArray(value) ? (value as string[]) : [],
      );
      control = (
        <div className="mt-1 flex flex-wrap gap-3">
          {field.options?.map((o) => (
            <label
              key={o.slug}
              className="flex items-center gap-1.5 text-sm text-foreground"
            >
              <input
                name={field.name}
                type="checkbox"
                value={o.slug}
                defaultChecked={selected.has(o.slug)}
                className="h-4 w-4 accent-accent"
              />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    }

    case "tags":
      control = (
        <input
          id={id}
          name={field.name}
          type="text"
          defaultValue={
            Array.isArray(value) ? (value as string[]).join(", ") : ""
          }
          className={inputClass}
        />
      );
      break;

    case "lines":
      control = (
        <textarea
          id={id}
          name={field.name}
          rows={3}
          defaultValue={linesToText(field.name, value)}
          className={`${inputClass} font-mono`}
        />
      );
      break;

    case "textarea":
      control = (
        <textarea
          id={id}
          name={field.name}
          rows={3}
          defaultValue={String(value ?? "")}
          className={inputClass}
        />
      );
      break;

    default: // text, url
      control = (
        <input
          id={id}
          name={field.name}
          type={field.kind === "url" ? "url" : "text"}
          defaultValue={String(value ?? "")}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
  }

  return (
    <div>
      {field.kind !== "checkbox" && label}
      {control}
      {field.kind !== "checkbox" && field.help && (
        <p className={helpClass}>{field.help}</p>
      )}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

export function MetaForm({ type, values, errors }: MetaFormProps) {
  const fields = TYPE_FIELDS[type];
  if (fields.length === 0) return null;
  return (
    <fieldset className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <Field
          key={field.name}
          field={field}
          value={values[field.name]}
          error={errors?.[field.name]}
        />
      ))}
    </fieldset>
  );
}
