interface ManualSection {
title: string
content: string
subsections?: ManualSection[]
}

interface ManualContent {
version: string
lastUpdated: string
sections: ManualSection[]
}

let manualContent: ManualContent | null = null

export async function loadManualContent(): Promise<ManualContent> {
if (manualContent) {
    return manualContent
}

try {
    const response = await fetch('path/to/manual.json')
    manualContent = await response.json()
    return manualContent
} catch (error) {
    console.error('Failed to load manual content:', error)
    throw error
}
}

export function getSection(sectionId: string): ManualSection | null {
if (!manualContent) {
    return null
}

function findSection(sections: ManualSection[], id: string): ManualSection | null {
    for (const section of sections) {
    if (section.title.toLowerCase().replace(/\s+/g, '-') === id) {
        return section
    }
    if (section.subsections) {
        const found = findSection(section.subsections, id)
        if (found) {
        return found
        }
    }
    }
    return null
}

return findSection(manualContent.sections, sectionId)
}

export function searchManual(query: string): ManualSection[] {
if (!manualContent) {
    return []
}

const results: ManualSection[] = []
const searchQuery = query.toLowerCase()

function searchSection(section: ManualSection) {
    if (
    section.title.toLowerCase().includes(searchQuery) ||
    section.content.toLowerCase().includes(searchQuery)
    ) {
    results.push(section)
    }
    if (section.subsections) {
    section.subsections.forEach(searchSection)
    }
}

manualContent.sections.forEach(searchSection)
return results
}

