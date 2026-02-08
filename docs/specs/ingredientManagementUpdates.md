# Feature Requirements: Ingredient Management

## Overview

The goal of this feature is to enhance ingredient management within the recipe application. Users should be able to easily reorder ingredients, manage sections, and interact with a more intuitive and efficient UI. This document outlines functional requirements, UI changes, technical considerations, and an implementation plan.

---

## Goals

Enable users to:

1. Set and maintain a custom order for ingredients within each section.
2. Drag and drop ingredients to reorder them, both within a section and across sections.
3. Use clearer and more intuitive UI controls for deleting and reordering ingredients.
4. Enter ingredients more efficiently through an improved input layout.
5. Persist ingredient order reliably in the database.

---

## 1. Ingredient Ordering & Drag-and-Drop

### Objective

Allow users to reorder ingredients intuitively using drag-and-drop interactions.

### Functional Requirements

* Ingredients must be draggable and droppable.
* Reordering should work:

  * Within a single section
  * Across different sections
* The resulting drop position becomes the new persisted order.

### Section Handling

* **With sections:**

  * Ingredients maintain a defined order within each section.
  * Dragging an ingredient into another section updates both its section and order.
* **Without sections:**

  * Ingredients exist in a single, free-form list.
  * Users can drag ingredients anywhere in the list.

---

## 2. UI Enhancements

### Objective

Improve clarity and usability when managing ingredients.

### Changes

* **Delete Icon**

  * Replace the existing delete icon with a clear "X" icon.
* **Drag Handle**

  * Add a visible drag handle (e.g., three horizontal lines) to each ingredient row.
  * Dragging should only be initiated from the handle to prevent accidental reordering.

---

## 3. Ingredient Input Layout

### Objective

Streamline ingredient data entry for speed and clarity.

### Field Order

The ingredient input form should follow this order:

1. Quantity
2. Unit
3. Ingredient Name
4. Notes

This layout prioritizes structured data first while keeping optional context (notes) last.

---

## 4. Database Considerations

### Objective

Ensure ingredient order and section placement are persisted correctly.

### Requirements

* Evaluate whether the current schema supports ordered ingredients.
* If not, introduce an explicit ordering mechanism.
* Maintain order when ingredients are added, removed, or moved between sections.

---

## 5. Additional Considerations

### User Experience (UX)

* Drag-and-drop should feel responsive and predictable.
* Provide visual feedback during drag operations (e.g., placeholder, highlight, animation).

### Accessibility

* Support keyboard-based reordering where possible.
* Ensure drag handles, delete actions, and list updates are accessible to screen readers.

### Performance

* Drag-and-drop interactions should remain smooth even with large ingredient lists.
* Avoid excessive re-renders during drag operations.

---


## Summary

This feature introduces structured, intuitive ingredient ordering while improving usability and data integrity. By combining thoughtful UI changes with reliable persistence and accessibility considerations, ingredient management becomes faster, clearer, and more powerful for users.
