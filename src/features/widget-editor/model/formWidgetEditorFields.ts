export type FormFieldType = 'text' | 'textarea';

export type FormField = {
  id: string;
  label: string;
  type: FormFieldType;
  placeholder: string;
};

const resolveFieldType = (value: unknown): FormFieldType => {
  return value === 'textarea' ? 'textarea' : 'text';
};

const resolveFieldId = (value: unknown, index: number): string => {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : `field-${index + 1}`;
};

export const resolveFormFields = (value: unknown): FormField[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item, index) => {
    const candidate = item as {
      id?: unknown;
      label?: unknown;
      type?: unknown;
      placeholder?: unknown;
    };

    return {
      id: resolveFieldId(candidate.id, index),
      label: typeof candidate.label === 'string' ? candidate.label : '',
      type: resolveFieldType(candidate.type),
      placeholder:
        typeof candidate.placeholder === 'string' ? candidate.placeholder : '',
    };
  });
};

const resolveNextFieldId = (fields: FormField[]): string => {
  const maxIndex = fields.reduce((currentMax, field) => {
    const match = /^field-(\d+)$/.exec(field.id);

    if (!match) {
      return currentMax;
    }

    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return `field-${maxIndex + 1}`;
};

export const createEmptyFormField = (id: string): FormField => {
  return {
    id,
    label: '',
    type: 'text',
    placeholder: '',
  };
};

export const appendEmptyFormField = (fields: FormField[]): FormField[] => {
  return [...fields, createEmptyFormField(resolveNextFieldId(fields))];
};

export const updateFormFieldAtIndex = (
  fields: FormField[],
  index: number,
  patch: Partial<FormField>,
): FormField[] => {
  return fields.map((field, fieldIndex) => {
    return fieldIndex === index ? {...field, ...patch} : field;
  });
};

export const removeFormFieldAtIndex = (
  fields: FormField[],
  index: number,
): FormField[] => {
  return fields.filter((_field, fieldIndex) => fieldIndex !== index);
};
