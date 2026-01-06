export interface RawTaskRow {
  row: number;
  cells: (string | number | null)[];
}

export interface Task {
  id: string;
  section: string;
  category: string;
  content: string;
  form: string; // 形式
  mentor: string; // 带教老师
  deadline: string; // 计划进行时间
  status: string; // 完成进度 (from excel)
  confirmed: boolean; // Local state
  completionDate?: string; // Local state
  score?: string; // from excel
}

export interface Section {
  title: string;
  tasks: Task[];
}

export function parseTasks(rows: RawTaskRow[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentCategory = "";

  // Start processing from row 9 where data begins
  const startRow = 9;

  for (const row of rows) {
    if (row.row < startRow) continue;
    
    const cells = row.cells;
    // Map columns based on the Excel structure
    // [1]: Section Title
    // [3]: Category
    // [4]: Content
    // [6]: Form
    // [7]: Mentor
    // [9]: Deadline
    // [14]: Score/Confirmation (last column)

    const sectionTitle = cells[1]?.toString().trim();
    const category = cells[3]?.toString().trim();
    const content = cells[4]?.toString().trim();

    // If no content, skip (maybe empty line)
    if (!content) continue;

    // New Section Detection
    // If sectionTitle is present and different from current, start new section
    // Or if sectionTitle is present (even if same), it might be explicit.
    // However, for merged cells in Excel converted to JSON, usually repeated values are present
    // or nulls. The provided JSON shows repeated values.
    if (sectionTitle && (!currentSection || currentSection.title !== sectionTitle)) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: sectionTitle,
        tasks: []
      };
      currentCategory = "";
    }

    if (category) {
      currentCategory = category;
    }

    if (currentSection) {
      const task: Task = {
        id: `task-${row.row}`,
        section: currentSection.title,
        category: currentCategory || "常规",
        content: content,
        form: cells[6]?.toString() || "",
        mentor: cells[7]?.toString() || "",
        deadline: cells[9]?.toString() || "",
        status: "", 
        score: cells[14]?.toString() || "",
        confirmed: false
      };
      currentSection.tasks.push(task);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

export function parseCSV(csvContent: string): Section[] {
  const lines = csvContent.split(/\r?\n/);
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentCategory = "";

  // Skip header if present (simple heuristic: check if first line contains "版块" or "Section")
  let startIndex = 0;
  if (lines[0] && (lines[0].includes("版块") || lines[0].toLowerCase().includes("section"))) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser: split by comma, handling quotes roughly
    // For robust parsing, a library like PapaParse is recommended, 
    // but here we implement a simple version for the spec requirement.
    const cells = parseCSVLine(line);
    
    // Expected format maps roughly to the internal Task structure or the previous Excel export
    // Let's assume a standard export format:
    // ID, Section, Category, Content, Form, Mentor, Deadline, Status, Score, Confirmed, CompletionDate
    
    // Fallback: if fewer columns, try to map based on index
    if (cells.length < 3) continue;

    const sectionTitle = cells[1]?.trim();
    const category = cells[2]?.trim();
    const content = cells[3]?.trim();

    if (sectionTitle && (!currentSection || currentSection.title !== sectionTitle)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: sectionTitle,
        tasks: []
      };
      currentCategory = "";
    }

    if (currentSection) {
        if (category) currentCategory = category;
        
        const task: Task = {
            id: cells[0] || `csv-row-${i}`,
            section: currentSection.title,
            category: currentCategory || "General",
            content: content || "",
            form: cells[4] || "",
            mentor: cells[5] || "",
            deadline: cells[6] || "",
            status: cells[7] || "",
            score: cells[8] || "",
            confirmed: cells[9] === "true",
            completionDate: cells[10] || undefined
        };
        currentSection.tasks.push(task);
    }
  }

  if (currentSection) sections.push(currentSection);
  return sections;
}

function parseCSVLine(text: string): string[] {
    const result: string[] = [];
    let cell = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
            cell += char;
        } else if (char === ',' && !inQuotes) {
            result.push(cell);
            cell = '';
        } else {
            cell += char;
        }
    }
    result.push(cell);
    return result.map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

export function exportToCSV(tasks: Task[]): string {
  const header = [
    "ID", "Section", "Category", "Content", "Form", "Mentor", 
    "Deadline", "Status", "Score", "Confirmed", "CompletionDate"
  ];
  
  const rows = tasks.map(t => [
    t.id,
    t.section,
    t.category,
    t.content,
    t.form,
    t.mentor,
    t.deadline,
    t.status,
    t.score || "",
    t.confirmed ? "true" : "false",
    t.completionDate || ""
  ]);

  return [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
