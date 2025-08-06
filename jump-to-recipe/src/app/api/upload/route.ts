import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadFile, FileUploadOptions } from '@/lib/file-storage';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!category || !['recipes', 'cookbooks', 'avatars'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Set upload options based on category
    const options: FileUploadOptions = {
      category: category as 'recipes' | 'cookbooks' | 'avatars',
    };

    // Configure image processing based on category
    switch (category) {
      case 'recipes':
        options.maxWidth = 1200;
        options.maxHeight = 800;
        options.quality = 85;
        break;
      case 'cookbooks':
        options.maxWidth = 600;
        options.maxHeight = 800;
        options.quality = 85;
        break;
      case 'avatars':
        options.maxWidth = 400;
        options.maxHeight = 400;
        options.quality = 90;
        break;
    }

    // Upload file
    const result = await uploadFile(file, options);

    return NextResponse.json({
      success: true,
      file: result,
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Upload failed',
        success: false 
      },
      { status: 500 }
    );
  }
}

// Handle file size limit
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}