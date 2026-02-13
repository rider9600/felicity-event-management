// Export array of objects to CSV string
export const exportToCSV = (data, fields) => {
  if (!data || data.length === 0) return "";
  const header = fields.join(",");
  const rows = data.map((item) =>
    fields
      .map((field) => {
        let value = item[field] ?? "";
        // Escape commas and quotes
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
        ) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(","),
  );
  return [header, ...rows].join("\n");
};
