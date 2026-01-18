🔨 Building Docker images...
[+] Building 121.8s (16/20)                                                                                                                                                      
 => [internal] load local bake definitions                                                                                                                                  0.0s
 => => reading from stdin 531B                                                                                                                                              0.0s
 => [internal] load build definition from Dockerfile                                                                                                                        0.0s
 => => transferring dockerfile: 1.20kB                                                                                                                                      0.0s
 => [internal] load metadata for docker.io/library/node:20-alpine                                                                                                           0.0s
 => [internal] load .dockerignore                                                                                                                                           0.0s
 => => transferring context: 233B                                                                                                                                           0.0s
 => CACHED [base 1/1] FROM docker.io/library/node:20-alpine@sha256:3960ed74dfe320a67bf8da9555b6bade25ebda2b22b6081d2f60fd7d5d430e9c                                         0.0s
 => => resolve docker.io/library/node:20-alpine@sha256:3960ed74dfe320a67bf8da9555b6bade25ebda2b22b6081d2f60fd7d5d430e9c                                                     0.0s
 => [internal] load build context                                                                                                                                           0.2s
 => => transferring context: 5.61MB                                                                                                                                         0.2s
 => CACHED [builder 1/4] WORKDIR /app                                                                                                                                       0.0s
 => [runner 2/7] RUN addgroup --system --gid 1001 nodejs                                                                                                                    0.3s
 => [deps 1/4] RUN apk add --no-cache libc6-compat                                                                                                                          1.0s
 => [runner 3/7] RUN adduser --system --uid 1001 nextjs                                                                                                                     0.2s
 => [deps 2/4] WORKDIR /app                                                                                                                                                 0.0s 
 => [deps 3/4] COPY jump-to-recipe/package*.json ./                                                                                                                         0.0s
 => [deps 4/4] RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps                                                                                             63.0s
 => [builder 2/4] COPY --from=deps /app/node_modules ./node_modules                                                                                                         6.7s 
 => [builder 3/4] COPY jump-to-recipe/ .                                                                                                                                    0.5s 
 => ERROR [builder 4/4] RUN npm run build                                                                                                                                  45.6s 
------                                                                                                                                                                           
 > [builder 4/4] RUN npm run build:                                                                                                                                              
0.566                                                                                                                                                                            
0.566 > jump-to-recipe@0.1.0 build                                                                                                                                               
0.566 > next build                                                                                                                                                               
0.566                                                                                                                                                                            
1.609    ▲ Next.js 15.4.1
1.610 
1.634    Creating an optimized production build ...
34.30  ✓ Compiled successfully in 27.0s
34.30    Linting and checking validity of types ...
45.26 
45.26 Failed to compile.
45.27 
45.27 ./src/app/admin/cookbooks/cookbook-list-client.tsx
45.27 20:3  Warning: 'filterAndSortCookbooks' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 100:6  Warning: React Hook useEffect has a missing dependency: 'fetchCookbooks'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 104:6  Warning: React Hook useEffect has a missing dependency: 'updateURL'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 
45.27 ./src/app/admin/recipes/page.tsx
45.27 8:15  Warning: 'RecipeWithAuthor' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/admin/users/[id]/__tests__/user-edit-form.test.tsx
45.27 18:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 30:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/admin/users/[id]/delete-user-modal.tsx
45.27 107:6  Warning: React Hook useEffect has a missing dependency: 'fetchTransferCandidates'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 120:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/admin/users/[id]/password-update-modal.tsx
45.27 9:15  Warning: 'UserWithCounts' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 98:6  Warning: React Hook useEffect has a missing dependency: 'handleClose'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 
45.27 ./src/app/admin/users/[id]/user-edit-form.tsx
45.27 20:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
45.27 22:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
45.27 
45.27 ./src/app/admin/users/__tests__/user-list-client.test.tsx
45.27 18:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/admin/users/user-list-client.tsx
45.27 21:8  Warning: 'SortDirection' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 24:1  Error: Use "@ts-expect-error" instead of "@ts-ignore", as "@ts-ignore" will do nothing if the following line is error-free.  @typescript-eslint/ban-ts-comment
45.27 
45.27 ./src/app/api/admin/cookbooks/[id]/collaborators/route.ts
45.27 1:23  Warning: 'NextResponse' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/recipes/route.ts
45.27 14:11  Warning: 'RecipeWithAuthor' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 63:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/[id]/__tests__/route.delete.test.ts
45.27 38:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 231:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 266:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/[id]/__tests__/route.get.test.ts
45.27 111:15  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 169:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 220:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 265:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 310:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 340:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 384:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 415:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/[id]/__tests__/route.put.test.ts
45.27 38:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 214:15  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 225:15  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 287:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 312:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 358:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 383:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 428:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 453:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 496:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 521:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 598:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 623:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 718:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 750:13  Warning: 'mockUpdate' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/[id]/route.ts
45.27 149:14  Warning: 'parseError' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 329:14  Warning: 'parseError' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/__tests__/route.test.ts
45.27 120:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 162:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 204:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 246:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 273:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/route.ts
45.27 16:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/admin/users/transfer-candidates/__tests__/route.test.ts
45.27 110:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 165:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 203:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 223:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 247:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 270:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 294:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 327:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 364:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 403:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 428:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 454:13  Warning: 'mockSelect' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/app/api/recipes/[id]/photos/__tests__/reorder.test.ts
45.27 4:10  Warning: 'db' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 45:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 55:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 76:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 89:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 110:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 123:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 145:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 157:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 176:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/api/recipes/[id]/photos/reorder/route.ts
45.27 62:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/api/recipes/[id]/route.ts
45.27 181:27  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/api/recipes/import/route.ts
45.27 157:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 234:71  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 290:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 327:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 333:56  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 412:65  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 446:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 452:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/api/recipes/photos/[photoId]/__tests__/route.test.ts
45.27 4:10  Warning: 'db' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 40:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 50:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 66:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 82:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 98:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 116:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 132:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 150:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 153:35  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 181:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 214:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 231:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 250:14  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/cookbooks/[id]/edit/page.tsx
45.27 4:10  Warning: 'revalidatePath' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 57:22  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/recipes/[id]/edit/page.tsx
45.27 137:59  Warning: 'photos' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 200:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/app/recipes/new/page.tsx
45.27 54:64  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 56:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/cookbooks/admin-collaborator-manager-standalone.tsx
45.27 34:25  Warning: 'setCollaborators' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 57:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/cookbooks/admin-collaborator-manager.tsx
45.27 55:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/cookbooks/admin-cookbook-management.tsx
45.27 22:24  Warning: 'setCurrentOwner' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 25:48  Warning: 'newOwnerId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/cookbooks/admin-ownership-transfer-standalone.tsx
45.27 132:6  Warning: React Hook useEffect has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 268:15  Warning: The attribute aria-required is not supported by the role button. This role is implicit on the element button.  jsx-a11y/role-supports-aria-props
45.27 323:53  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
45.27 323:92  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
45.27 
45.27 ./src/components/cookbooks/admin-ownership-transfer.tsx
45.27 129:6  Warning: React Hook useEffect has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 268:15  Warning: The attribute aria-required is not supported by the role button. This role is implicit on the element button.  jsx-a11y/role-supports-aria-props
45.27 323:53  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
45.27 323:92  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
45.27 
45.27 ./src/components/recipes/__tests__/recipe-display-photos.test.tsx
45.27 12:46  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 24:46  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/recipes/__tests__/recipe-editor-with-sections.test.tsx
45.27 9:37  Warning: 'control' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:46  Warning: 'watch' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:53  Warning: 'errors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:61  Warning: 'setError' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:71  Warning: 'clearErrors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:97  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 18:38  Warning: 'control' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 18:47  Warning: 'watch' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 18:54  Warning: 'errors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 18:62  Warning: 'setError' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 18:72  Warning: 'clearErrors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 18:98  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 28:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 29:5  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 
45.27 ./src/components/recipes/__tests__/recipe-form-with-sections.test.tsx
45.27 2:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 5:15  Warning: 'NewRecipeInput' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 14:37  Warning: 'control' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 14:46  Warning: 'watch' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 14:53  Warning: 'errors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 14:61  Warning: 'setError' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 14:71  Warning: 'clearErrors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 14:97  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 72:38  Warning: 'control' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 72:47  Warning: 'watch' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 72:54  Warning: 'errors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 72:62  Warning: 'setError' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 72:72  Warning: 'clearErrors' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 72:98  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 131:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/recipes/__tests__/recipe-ingredients-with-sections.test.tsx
45.27 2:8  Warning: 'userEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 21:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 22:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/recipes/__tests__/recipe-instructions-with-sections.test.tsx
45.27 2:8  Warning: 'userEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:34  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 21:25  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 22:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 196:10  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 288:12  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/recipes/__tests__/recipe-migration-helper.test.tsx
45.27 87:30  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 88:31  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 283:31  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 
45.27 ./src/components/recipes/__tests__/recipe-photos-manager.test.tsx
45.27 2:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 14:29  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 20:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 30:41  Warning: 'sizes' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 30:61  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 31:12  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 37:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 250:13  Warning: 'mockDragResult' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/recipes/__tests__/recipe-photos-upload-component.test.tsx
45.27 2:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 8:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 31:54  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 32:12  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 37:7  Warning: 'mockToast' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 91:58  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 96:23  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 154:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 176:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 192:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 208:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 230:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 253:37  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 275:38  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 300:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 322:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 352:60  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 354:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 366:60  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 368:64  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 379:60  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 380:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 383:60  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 411:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 431:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 460:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 478:40  Error: A `require()` style import is forbidden.  @typescript-eslint/no-require-imports
45.27 
45.27 ./src/components/recipes/__tests__/recipe-photos-upload.test.tsx
45.27 1:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 8:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 9:5  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 
45.27 ./src/components/recipes/__tests__/recipe-photos-viewer-component.test.tsx
45.27 9:63  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 11:7  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 23:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 272:13  Warning: 'firstPhoto' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/recipes/__tests__/recipe-photos-viewer.test.tsx
45.27 8:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/recipes/assign-owner-section.tsx
45.27 108:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render.  react-hooks/rules-of-hooks
45.27 133:6  Warning: React Hook useEffect has a missing dependency: 'toast'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
45.27 136:25  Error: React Hook "useMemo" is called conditionally. React Hooks must be called in the exact same order in every component render.  react-hooks/rules-of-hooks
45.27 161:3  Error: React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render.  react-hooks/rules-of-hooks
45.27 205:13  Warning: The attribute aria-required is not supported by the role button. This role is implicit on the element button.  jsx-a11y/role-supports-aria-props
45.27 
45.27 ./src/components/recipes/photo-lightbox.tsx
45.27 376:9  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 
45.27 ./src/components/recipes/recipe-display.tsx
45.27 3:73  Warning: 'Minus' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 3:80  Warning: 'Plus' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 34:20  Warning: 'setServings' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/recipes/recipe-form.tsx
45.27 4:19  Warning: 'useFieldArray' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 43:10  Warning: 'RecipePhotosUpload' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 107:62  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 128:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 148:37  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 334:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 335:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 336:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 337:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 338:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 344:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 345:32  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 346:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 347:38  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 348:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 534:57  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 543:41  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 671:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
45.27 
45.27 ./src/components/recipes/recipe-ingredients-with-sections.tsx
45.27 31:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 32:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 33:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 34:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 35:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 61:13  Warning: 'sectionFields' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 63:13  Warning: 'removeSection' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/recipes/recipe-instructions-with-sections.tsx
45.27 25:20  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 26:23  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 27:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 28:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 29:36  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 55:13  Warning: 'sectionFields' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 57:13  Warning: 'removeSection' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/recipes/recipe-migration-helper.tsx
45.27 61:9  Warning: 'handleRevert' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/recipes/recipe-photos-manager.tsx
45.27 6:40  Warning: 'AlertCircle' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 116:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/recipes/recipe-photos-upload.tsx
45.27 164:44  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 180:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/sections/__tests__/editable-title.test.tsx
45.27 1:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 1:37  Warning: 'waitFor' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/sections/__tests__/section-accessibility.test.tsx
45.27 1:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 28:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 351:13  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 369:13  Warning: 'user' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/sections/__tests__/section-animations.test.tsx
45.27 26:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/sections/__tests__/section-manager-empty-indicators.test.tsx
45.27 9:41  Warning: 'index' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 9:48  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 19:59  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/sections/__tests__/section-manager.test.tsx
45.27 1:26  Warning: 'fireEvent' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 1:37  Warning: 'waitFor' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 359:15  Warning: 'container' is assigned a value but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/sections/__tests__/section-performance.test.tsx
45.27 1:37  Warning: 'act' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 23:24  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/components/sections/section-manager.tsx
45.27 14:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 83:3  Warning: 'onRemoveItem' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/components/ui/use-toast.ts
45.27 18:7  Warning: 'actionTypes' is assigned a value but only used as a type.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/lib/__tests__/photo-soft-deletion.test.ts
45.27 309:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/lib/__tests__/recipe-migration.test.ts
45.27 6:18  Warning: 'Ingredient' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 6:30  Warning: 'Instruction' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 7:30  Warning: 'IngredientSection' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 7:49  Warning: 'InstructionSection' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 201:69  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 228:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 229:31  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 247:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 414:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/lib/__tests__/section-utils.test.ts
45.27 3:3  Warning: 'Ingredient' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 4:3  Warning: 'Instruction' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/lib/performance-cache.ts
45.27 39:45  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 120:28  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 173:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 188:35  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/lib/photo-operations.ts
45.27 3:27  Warning: 'gt' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 97:48  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 156:50  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/lib/recipe-migration.ts
45.27 74:51  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 82:53  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 87:21  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 275:39  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 311:42  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 324:43  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 343:46  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 366:47  Warning: 'sectionId' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/lib/validations/__tests__/photo-validation.test.ts
45.27 8:3  Warning: 'ALLOWED_PHOTO_MIME_TYPES' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/lib/validations/__tests__/recipe-sections.test.ts
45.27 4:3  Warning: 'recipeWithSectionsSchema' is defined but never used.  @typescript-eslint/no-unused-vars
45.27 
45.27 ./src/lib/validations/recipe.ts
45.27 199:47  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 207:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 209:40  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/types/admin-cookbook.ts
45.27 213:51  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 222:42  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 232:10  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 ./src/types/sections.ts
45.27 4:30  Error: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
45.27 
45.27 info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
45.30 npm notice
45.30 npm notice New major version of npm available! 10.8.2 -> 11.7.0
45.30 npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
45.30 npm notice To update run: npm install -g npm@11.7.0
45.30 npm notice
------
Dockerfile:24

--------------------

  22 |     

  23 |     # Build the application

  24 | >>> RUN npm run build

  25 |     

  26 |     # Production image, copy all the files and run next

--------------------

failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1