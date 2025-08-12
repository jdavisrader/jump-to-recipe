import { resolve as resolvePath, dirname } from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function resolve(specifier, context, nextResolve) {
  // Handle @/ alias
  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2); // Remove '@/'
    const resolvedPath = resolvePath(__dirname, 'src', relativePath);
    
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    for (const ext of extensions) {
      const pathWithExt = resolvedPath + ext;
      if (existsSync(pathWithExt)) {
        return {
          url: pathToFileURL(pathWithExt).href,
          shortCircuit: true
        };
      }
    }
    
    // Try index files
    for (const ext of extensions) {
      const indexPath = resolvePath(resolvedPath, 'index' + ext);
      if (existsSync(indexPath)) {
        return {
          url: pathToFileURL(indexPath).href,
          shortCircuit: true
        };
      }
    }
    
    // If no file found, let it fall through to default resolution
  }
  
  return nextResolve(specifier, context);
}