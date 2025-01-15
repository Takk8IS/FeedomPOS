import { promises as fs } from 'fs';
import path from 'path';

export interface ManualSection {
  title: string;
  content: string;
  subsections?: ManualSection[];
}

export interface ManualContent {
  version: string;
  lastUpdated: string;
  sections: ManualSection[];
}

let manualContent: ManualContent | null = null;

/**
 * Loads the manual content from a JSON file
 * @returns Promise<ManualContent>
 * @throws Error if loading fails
 */
export async function loadManualContent(): Promise<ManualContent> {
  if (manualContent) {
    return manualContent;
  }

  try {
    const manualPath = path.join(process.cwd(), 'src', 'data', 'manual.json');
    const data = await fs.readFile(manualPath, 'utf8');
    manualContent = JSON.parse(data) as ManualContent;

    if (!isValidManualContent(manualContent)) {
      throw new Error('Invalid manual content structure');
    }

    return manualContent;
  } catch (error) {
    console.error('Failed to load manual content:', error);
    throw new Error(
      `Failed to load manual content: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Gets a specific section from the manual
 * @param sectionId The ID of the section to retrieve
 * @returns ManualSection | null
 */
export function getSection(sectionId: string): ManualSection | null {
  if (!manualContent) {
    console.warn('Manual content not loaded. Call loadManualContent() first.');
    return null;
  }

  return findSection(manualContent.sections, sectionId);
}

/**
 * Searches the manual for a given query
 * @param query The search query
 * @returns ManualSection[]
 */
export function searchManual(query: string): ManualSection[] {
  if (!manualContent) {
    console.warn('Manual content not loaded. Call loadManualContent() first.');
    return [];
  }

  const results: ManualSection[] = [];
  const searchQuery = query.toLowerCase();

  function searchSection(section: ManualSection) {
    if (
      section.title.toLowerCase().includes(searchQuery) ||
      section.content.toLowerCase().includes(searchQuery)
    ) {
      results.push(section);
    }
    if (section.subsections) {
      section.subsections.forEach(searchSection);
    }
  }

  manualContent.sections.forEach(searchSection);
  return results;
}

/**
 * Generates a table of contents for the manual
 * @returns string[]
 */
export function generateTableOfContents(): string[] {
  if (!manualContent) {
    console.warn('Manual content not loaded. Call loadManualContent() first.');
    return [];
  }

  const toc: string[] = [];

  function addToToc(section: ManualSection, depth: number = 0) {
    toc.push(`${'  '.repeat(depth)}${section.title}`);
    if (section.subsections) {
      section.subsections.forEach((subsection) => addToToc(subsection, depth + 1));
    }
  }

  manualContent.sections.forEach((section) => addToToc(section));
  return toc;
}

/**
 * Validates the structure of the manual content
 * @param content The manual content to validate
 * @returns boolean
 */
function isValidManualContent(content: any): content is ManualContent {
  return (
    typeof content === 'object' &&
    typeof content.version === 'string' &&
    typeof content.lastUpdated === 'string' &&
    Array.isArray(content.sections) &&
    content.sections.every(isValidManualSection)
  );
}

/**
 * Validates the structure of a manual section
 * @param section The section to validate
 * @returns boolean
 */
function isValidManualSection(section: any): section is ManualSection {
  return (
    typeof section === 'object' &&
    typeof section.title === 'string' &&
    typeof section.content === 'string' &&
    (section.subsections === undefined ||
      (Array.isArray(section.subsections) && section.subsections.every(isValidManualSection)))
  );
}

/**
 * Recursively searches for a section by ID
 * @param sections The sections to search
 * @param id The ID to search for
 * @returns ManualSection | null
 */
function findSection(sections: ManualSection[], id: string): ManualSection | null {
  for (const section of sections) {
    const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
    if (sectionId === id) {
      return section;
    }
    if (section.subsections) {
      const found = findSection(section.subsections, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export type { ManualSection, ManualContent };
