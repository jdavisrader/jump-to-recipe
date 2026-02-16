/**
 * Instruction Cleaner Module
 * 
 * Cleans HTML and formats instruction text.
 * Uses html-to-text library to remove HTML tags while preserving structure.
 * 
 * Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */

import { v4 as uuidv4 } from 'uuid';
import { convert } from 'html-to-text';
import type { LegacyInstruction } from '../types/extraction';
import type { Instruction } from '../../types/recipe';
import type { CleanedInstruction, UnparseableItem, TransformationStats } from './recipe-transformer';

// ============================================================================
// Instruction Cleaning
// ============================================================================

/**
 * Clean legacy instructions and convert to structured format
 * 
 * Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 * 
 * @param instructions - Legacy instructions for a recipe (already sorted by step_number)
 * @param recipeId - Legacy recipe ID for error tracking
 * @param recipeTitle - Recipe title for error reporting
 * @param stats - Statistics tracker
 * @param unparseableItems - Array to collect unparseable items
 * @returns Array of cleaned instructions
 */
export async function cleanInstructions(
  instructions: LegacyInstruction[],
  recipeId: number,
  recipeTitle: string,
  stats: TransformationStats,
  unparseableItems: UnparseableItem[]
): Promise<Instruction[]> {
  const cleaned: Instruction[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];
    
    try {
      const cleanedInstruction = cleanInstructionHtml(
        instruction.step,
        instruction.step_number
      );

      // Check if instruction is empty after cleaning (Requirement 4.7)
      if (!cleanedInstruction.content || cleanedInstruction.content.trim().length === 0) {
        stats.instructionsEmpty++;
        
        // Flag for manual review
        unparseableItems.push({
          recipeId,
          recipeTitle,
          type: 'instruction',
          originalText: instruction.step,
          reason: 'Instruction is empty after HTML cleaning',
        });

        // Skip empty instructions
        continue;
      }

      stats.instructionsCleaned++;
      cleaned.push(cleanedInstruction);
    } catch (error) {
      stats.instructionsEmpty++;
      
      // Log error and add to unparseable items
      console.warn(`⚠ Failed to clean instruction for recipe ${recipeId}: ${instruction.step}`);
      unparseableItems.push({
        recipeId,
        recipeTitle,
        type: 'instruction',
        originalText: instruction.step,
        reason: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Renumber steps sequentially (Requirement 4.6)
  return cleaned.map((instruction, index) => ({
    ...instruction,
    step: index + 1,
  }));
}

/**
 * Clean HTML from instruction text
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 * 
 * @param html - Instruction text (may contain HTML)
 * @param stepNumber - Original step number
 * @returns Cleaned instruction with UUID
 */
export function cleanInstructionHtml(html: string, stepNumber: number): CleanedInstruction {
  // Generate UUID (Requirement 4.5)
  const id = uuidv4();

  // Store original HTML for reference
  const originalHtml = html;

  // Clean HTML using html-to-text library (Requirement 4.1)
  const cleanedText = convert(html, {
    wordwrap: false, // Don't wrap lines
    preserveNewlines: true, // Keep paragraph breaks (Requirement 4.4)
    selectors: [
      // Remove script and style tags completely
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
      // Convert common HTML elements
      { selector: 'p', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      { selector: 'br', format: 'lineBreak' },
      { selector: 'strong', format: 'inline' },
      { selector: 'b', format: 'inline' },
      { selector: 'em', format: 'inline' },
      { selector: 'i', format: 'inline' },
      { selector: 'ul', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      { selector: 'ol', options: { leadingLineBreaks: 1, trailingLineBreaks: 1 } },
      { selector: 'li', format: 'block', options: { leadingLineBreaks: 1 } },
    ],
  });

  // Normalize whitespace (Requirement 4.3)
  const normalized = normalizeWhitespace(cleanedText);

  // Convert HTML entities (Requirement 4.2)
  const content = decodeHtmlEntities(normalized);

  return {
    id,
    step: stepNumber,
    content,
    duration: undefined, // Not in legacy data
    position: 0, // Will be set during normalization
    originalHtml,
  };
}

/**
 * Normalize whitespace and line breaks
 * 
 * Requirement 4.3: Normalize whitespace and line breaks
 */
function normalizeWhitespace(text: string): string {
  return (
    text
      // Replace multiple spaces with single space
      .replace(/ +/g, ' ')
      // Replace multiple newlines with double newline (paragraph break)
      .replace(/\n{3,}/g, '\n\n')
      // Trim leading/trailing whitespace
      .trim()
  );
}

/**
 * Decode HTML entities
 * 
 * Requirement 4.2: Convert HTML entities to plain text
 * 
 * Examples:
 * - &nbsp; → space
 * - &quot; → "
 * - &amp; → &
 * - &lt; → <
 * - &gt; → >
 * - &#39; → '
 */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&quot;': '"',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&#39;': "'",
    '&apos;': "'",
    '&ndash;': '–',
    '&mdash;': '—',
    '&hellip;': '…',
    '&deg;': '°',
    '&frac12;': '½',
    '&frac14;': '¼',
    '&frac34;': '¾',
  };

  let decoded = text;

  // Replace named entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  // Replace numeric entities (&#123; or &#xAB;)
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

/**
 * Split text into multiple steps if it contains paragraph breaks
 * 
 * This is optional and can be used if instructions contain multiple
 * paragraphs that should be separate steps.
 * 
 * Requirement 4.4: Preserve paragraph breaks as separate steps if appropriate
 */
export function splitIntoSteps(text: string): string[] {
  // Split by double newlines (paragraph breaks)
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);

  // Only split if we have multiple substantial paragraphs
  if (paragraphs.length > 1 && paragraphs.every((p) => p.length > 20)) {
    return paragraphs;
  }

  // Otherwise, keep as single step
  return [text];
}
