import { describe, it, expect } from 'vitest';
import { exportToCSV, parseCSV, parseTasks, Task, RawTaskRow } from './data-parser';

describe('CSV Parser', () => {
  const sampleTasks: Task[] = [
    {
      id: '1',
      section: 'Section A',
      category: 'Category 1',
      content: 'Task 1 Content',
      form: 'Online',
      mentor: 'Mentor A',
      deadline: '2023-12-31',
      status: 'Pending',
      score: '10',
      confirmed: true,
      completionDate: '2023-10-01'
    },
    {
      id: '2',
      section: 'Section A',
      category: 'Category 1',
      content: 'Task "2" Content with comma,',
      form: 'Offline',
      mentor: 'Mentor B',
      deadline: '2024-01-01',
      status: 'Done',
      confirmed: false
    }
  ];

  it('should export tasks to CSV format', () => {
    const csv = exportToCSV(sampleTasks);
    expect(csv).toContain('"ID","Section","Category"');
    expect(csv).toContain('"1","Section A","Category 1","Task 1 Content"');
    // Check for quoted content handling
    expect(csv).toContain('"Task ""2"" Content with comma,"');
  });

  it('should parse CSV back to sections and tasks', () => {
    const csv = exportToCSV(sampleTasks);
    const sections = parseCSV(csv);

    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Section A');
    expect(sections[0].tasks).toHaveLength(2);

    const task1 = sections[0].tasks[0];
    expect(task1.id).toBe('1');
    expect(task1.content).toBe('Task 1 Content');
    expect(task1.confirmed).toBe(true);

    const task2 = sections[0].tasks[1];
    expect(task2.content).toBe('Task "2" Content with comma,');
    expect(task2.confirmed).toBe(false);
  });
});

describe('JSON Task Parser', () => {
  it('should parse raw tasks from Excel/JSON format', () => {
    const rawRows: RawTaskRow[] = [
      // Headers (rows 1-8 are skipped)
      { row: 1, cells: [] },
      { row: 8, cells: [] },
      // Data
      {
        row: 9,
        cells: [
          null,
          "Section A",
          null,
          "Category 1",
          "Task 1 Content",
          null,
          "Online",
          "Mentor A",
          null,
          "2023-12-31",
          null, null, null, null, "Score 10"
        ]
      },
      {
        row: 10,
        cells: [
          null,
          "Section A", // Same section
          null,
          "Category 1", // Same category
          "Task 2 Content",
          null,
          "Offline",
          "Mentor B",
          null,
          "2024-01-01",
          null, null, null, null, null
        ]
      },
       {
        row: 11,
        cells: [
          null,
          "Section B", // New section
          null,
          "Category 2",
          "Task 3 Content",
          null,
          "Online",
          "Mentor C",
          null,
          "2024-01-02",
          null, null, null, null, null
        ]
      }
    ];

    const sections = parseTasks(rawRows);
    
    expect(sections).toHaveLength(2);
    
    // Section A
    expect(sections[0].title).toBe("Section A");
    expect(sections[0].tasks).toHaveLength(2);
    expect(sections[0].tasks[0].content).toBe("Task 1 Content");
    expect(sections[0].tasks[0].score).toBe("Score 10");
    expect(sections[0].tasks[1].content).toBe("Task 2 Content");

    // Section B
    expect(sections[1].title).toBe("Section B");
    expect(sections[1].tasks).toHaveLength(1);
    expect(sections[1].tasks[0].content).toBe("Task 3 Content");
  });
});
