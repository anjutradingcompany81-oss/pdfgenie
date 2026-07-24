import { PDFDocument, PDFTextField, PDFCheckBox, PDFDropdown, PDFRadioGroup } from "pdf-lib";

export type FormFieldDescriptor =
  | { kind: "text"; name: string; value: string }
  | { kind: "checkbox"; name: string; checked: boolean }
  | { kind: "dropdown"; name: string; options: string[]; value: string }
  | { kind: "radio"; name: string; options: string[]; value: string };

export async function readFormFields(bytes: ArrayBuffer): Promise<FormFieldDescriptor[]> {
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const fields = form.getFields();

  return fields.map((field) => {
    const name = field.getName();
    if (field instanceof PDFCheckBox) {
      return { kind: "checkbox", name, checked: field.isChecked() };
    }
    if (field instanceof PDFDropdown) {
      return { kind: "dropdown", name, options: field.getOptions(), value: field.getSelected()[0] ?? "" };
    }
    if (field instanceof PDFRadioGroup) {
      return { kind: "radio", name, options: field.getOptions(), value: field.getSelected() ?? "" };
    }
    if (field instanceof PDFTextField) {
      return { kind: "text", name, value: field.getText() ?? "" };
    }
    return { kind: "text", name, value: "" };
  });
}

export async function fillForm(
  bytes: ArrayBuffer,
  values: Record<string, string | boolean>
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();

  for (const field of form.getFields()) {
    const name = field.getName();
    if (!(name in values)) continue;
    const value = values[name];

    if (field instanceof PDFCheckBox) {
      if (value) field.check();
      else field.uncheck();
    } else if (field instanceof PDFDropdown) {
      if (typeof value === "string" && value) field.select(value);
    } else if (field instanceof PDFRadioGroup) {
      if (typeof value === "string" && value) field.select(value);
    } else if (field instanceof PDFTextField) {
      field.setText(typeof value === "string" ? value : "");
    }
  }

  return doc.save();
}
