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

export function parseTasks(rawData: RawTaskRow[]): Section[] {
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentCategory = "";

  // Start processing from row where actual data begins
  // We look for rows that contain "版块" or seem like task rows
  // Based on analysis:
  // Col 1 (index 1): Section Title (e.g. "版块一\n入职培训")
  // Col 2 (index 2): Category (e.g. "（必选）...")
  // Col 3 (index 3): Content (The main task description)
  // Col 9 (index 9): Planned Time
  // Col 14 (index 14): Confirmation/Score

  for (const entry of rawData) {
    const cells = entry.cells;
    // Skip empty rows or rows with too few cells
    if (!cells || cells.length < 5) continue;

    // Check for Section Header in Col 1
    const col1 = String(cells[1] || "").trim();
    if (col1 && (col1.includes("版块") || col1.includes("阶段"))) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: col1.replace(/\n/g, " "),
        tasks: [],
      };
      currentCategory = ""; // Reset category
    }

    // If we have a current section, try to parse task
    if (currentSection) {
      const col2 = String(cells[2] || "").trim();
      if (col2) currentCategory = col2;

      const content = String(cells[3] || "").trim();
      // Only treat as task if there is content
      if (content && content !== "培训内容" && content !== "项目") {
        const task: Task = {
          id: `row-${entry.row}`,
          section: currentSection.title,
          category: currentCategory || "General",
          content: content,
          form: String(cells[4] || ""),
          mentor: String(cells[5] || ""),
          deadline: String(cells[9] || ""), // Assuming Col J is Plan Time
          status: String(cells[10] || ""), // Assuming Col K is Progress
          score: String(cells[14] || ""), // Assuming Col O is Score
          confirmed: false,
        };
        currentSection.tasks.push(task);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}
