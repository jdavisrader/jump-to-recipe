# Implementation Plan

## Overview

This implementation plan converts the Recipe Sections feature from implicit position tracking (via array order) to explicit position persistence (via a position property). The work is organized into discrete, testable phases that build incrementally.

---

## Phase 1: Type System Foundation

- [x] 1. Update core type definitions
  - Update `Ingredient` interface to include `position: number`
  - Update `Instruction` interface to include `position: number`
  - Update `ExtendedIngredient` to include position
  - Update `ExtendedInstruction` to include position
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Update validation schemas
  - Add position validation to `strictIngredientItemSchema`
  - Add position validation to `strictInstructionItemSchema`
  - Add position validation to extended schemas
  - Ensure position is required, non-negative integer
  - _Requirements: 2.3, 6.1, 6.2, 6.3_

- [x] 3. Fix TypeScript compilation errors
  - Update all test fixtures to include position
  - Update mock data generators to include position
  - Fix type errors in component files
  - Fix type errors in utility files
  - _Requirements: 2.4_

- [x] 4. Update position utility interfaces
  - Remove `PositionedItem` interface (now redundant)
  - Update utility functions to work with `Ingredient` and `Instruction` directly
  - Remove runtime type coercion
  - _Requirements: 2.4_

---

## Phase 2: Normalization Layer Updates

- [x] 5. Update recipe normalizer for position
  - Modify `normalizeIngredientItems` to ensure position always present
  - Modify `normalizeInstructionItems` to ensure position always present
  - Update `normalizeImportedRecipe` to handle missing positions
  - Update `normalizeExistingRecipe` to add positions to legacy data
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 6. Update position assignment logic
  - Ensure `getNextPosition` works with new type system
  - Update item creation to always assign position
  - Update section creation to assign positions to items
  - _Requirements: 1.1, 1.2, 4.1, 4.2_

- [ ]* 6.1 Write property test for position presence
  - **Property 1: Position Presence**
  - **Validates: Requirements 1.1, 1.2, 2.1, 2.2**

- [ ]* 6.2 Write property test for position uniqueness
  - **Property 2: Position Uniqueness Within Scope**
  - **Validates: Requirements 3.5, 4.1, 4.2, 6.3**

- [ ]* 6.3 Write property test for position sequentiality
  - **Property 3: Position Sequentiality**
  - **Validates: Requirements 3.5, 4.1, 4.2**

---

## Phase 3: Component Layer Updates

- [x] 7. Remove position stripping logic
  - Remove position stripping in `handleFlatListDragEnd`
  - Remove position stripping in `handleSectionedDragEnd` (within-section)
  - Remove position stripping in `handleSectionedDragEnd` (cross-section)
  - Keep position in form state throughout lifecycle
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 8. Update drag-and-drop handlers
  - Verify position maintained during within-section reorder
  - Verify position recalculated during cross-section move
  - Verify position updated during flat list reorder
  - Update position conflict detection
  - _Requirements: 3.4, 4.3_

- [x] 9. Update section toggle logic
  - Ensure position preserved when converting sections to flat list
  - Ensure position recalculated when converting flat list to sections
  - Update `handleToggleSections` to maintain position
  - _Requirements: 4.4, 4.5_

- [ ]* 9.1 Write property test for position recalculation on move
  - **Property 5: Position Recalculation on Move**
  - **Validates: Requirements 4.3**

- [ ]* 9.2 Write property test for position preservation on reorder
  - **Property 6: Position Preservation on Reorder**
  - **Validates: Requirements 3.4**

---

## Phase 4: API Layer Updates

- [x] 10. Update API request handling
  - Verify position included in POST /api/recipes
  - Verify position included in PUT /api/recipes/[id]
  - Update API validation to check position presence
  - Update error messages for position validation failures
  - _Requirements: 7.1, 7.2, 7.4_

 - [x] 11. Update API response handling
  - Ensure position included in GET /api/recipes
  - Ensure position included in GET /api/recipes/[id]
  - Verify position in all recipe list responses
  - _Requirements: 7.3_

- [x] 12. Update API documentation
  - Document position as required field in API docs
  - Add examples showing position in request/response
  - Document position validation rules
  - Document auto-correction behavior
  - _Requirements: 7.1, 7.5_

---

## Phase 5: Database Migration

- [x] 13. Create migration script
  - Write `migrateRecipesToExplicitPositions` function
  - Add position to flat ingredients based on array index
  - Add position to flat instructions based on array index
  - Add position to items within ingredient sections
  - Add position to items within instruction sections
  - _Requirements: 8.1, 8.2_

- [x] 14. Add migration logging and error handling
  - Log migration progress (recipes processed, updated)
  - Log errors without stopping migration
  - Create migration summary report
  - _Requirements: 8.3, 8.4_

- [x] 15. Test migration script
  - Test on sample data with various edge cases
  - Test on recipes without positions
  - Test on recipes with partial positions
  - Test on recipes with invalid positions
  - Verify idempotency (safe to run multiple times)
  - _Requirements: 8.5_

- [ ]* 15.1 Write property test for legacy data migration
  - **Property 7: Legacy Data Migration**
  - **Validates: Requirements 5.1, 5.2**

---

## Phase 6: Testing and Validation

- [x] 16. Update existing unit tests
  - Update all test fixtures to include position
  - Update component tests for new behavior
  - Update utility function tests
  - Ensure all tests pass
  - _Requirements: All_

- [ ]* 17. Write property-based tests
  - Property test for position presence (100+ runs)
  - Property test for position uniqueness (100+ runs)
  - Property test for position sequentiality (100+ runs)
  - Property test for round-trip persistence (50+ runs)
  - Property test for position recalculation (100+ runs)
  - _Requirements: All correctness properties_

- [ ]* 17.1 Write property test for round-trip persistence
  - **Property 4: Position Persistence Round-Trip**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

- [ ]* 17.2 Write property test for type system consistency
  - **Property 8: Type System Consistency**
  - **Validates: Requirements 2.1, 2.2, 2.4**

- [x] 18. Integration testing
  - Test drag-and-drop in browser
  - Test section toggle functionality
  - Test recipe save/load cycle
  - Test API endpoints with position data
  - _Requirements: All_

- [x] 19. Performance testing
  - Benchmark position assignment (should be O(n))
  - Benchmark position validation (should be O(n))
  - Benchmark drag-and-drop (should be < 100ms)
  - Verify no regression in UI responsiveness
  - _Requirements: Performance requirements_

---

## Phase 7: Deployment

- [ ] 20. Deploy to staging environment
  - Deploy updated code to staging
  - Run migration script on staging database
  - Verify all recipes load correctly
  - Test all user workflows
  - Monitor for errors
  - _Requirements: All_

- [ ] 21. Staging validation
  - Verify position in database for sample recipes
  - Test drag-and-drop functionality
  - Test section toggle functionality
  - Test recipe creation and editing
  - Verify API responses include position
  - _Requirements: All_

- [ ] 22. Production deployment
  - Deploy to production during low-traffic period
  - Run migration script on production database
  - Monitor error rates and performance
  - Verify user workflows
  - Have rollback plan ready
  - _Requirements: All_

- [ ] 23. Post-deployment validation
  - Verify migration statistics (100% success expected)
  - Monitor error logs for position-related issues
  - Check user feedback for ordering issues
  - Verify no regression in performance metrics
  - _Requirements: 8.3, 8.5_

---

## Phase 8: Documentation and Cleanup

- [x] 24. Update developer documentation
  - Document position property in type definitions
  - Document position validation rules
  - Document position scope (section vs flat list)
  - Update architecture diagrams
  - _Requirements: 7.1_

- [x] 25. Update user documentation
  - Update user guide if needed
  - Document any behavior changes
  - Update FAQ if needed
  - _Requirements: None (internal change)_

- [x] 26. Code cleanup
  - Remove obsolete position-related comments
  - Remove temporary migration code if any
  - Refactor any duplicated position logic
  - Update code comments to reflect new architecture
  - _Requirements: Maintainability_

---

## Rollback Plan

If critical issues are discovered after deployment:

1. **Immediate**: Revert code deployment to previous version
2. **Database**: Position data can remain (backward compatible)
3. **Verification**: Confirm old code works with position data present
4. **Investigation**: Analyze root cause of issues
5. **Fix**: Address issues and redeploy

---

## Success Criteria

The implementation is complete when:

- ✅ All TypeScript compilation errors resolved
- ✅ All unit tests passing
- ✅ All property-based tests passing (100+ runs each)
- ✅ All integration tests passing
- ✅ Migration script runs successfully on all recipes
- ✅ Position data persisted and loaded correctly
- ✅ Drag-and-drop functionality works as before
- ✅ No performance regression
- ✅ API documentation updated
- ✅ Zero position-related errors in production logs

---

## Estimated Timeline

- **Phase 1-2**: 2-3 days (Type system and normalization)
- **Phase 3**: 2-3 days (Component updates)
- **Phase 4**: 1-2 days (API updates)
- **Phase 5**: 2-3 days (Migration script and testing)
- **Phase 6**: 3-4 days (Comprehensive testing)
- **Phase 7**: 2-3 days (Deployment and validation)
- **Phase 8**: 1-2 days (Documentation and cleanup)

**Total**: 13-20 days (approximately 3-4 weeks)

---

## Notes

- Tasks marked with `*` are optional property-based tests
- Each phase should be completed and tested before moving to the next
- Migration script should be tested thoroughly on staging before production
- Rollback plan should be ready before production deployment
- Monitor production closely for 48 hours after deployment
