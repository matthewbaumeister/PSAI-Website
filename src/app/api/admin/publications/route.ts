import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { publications, type Publication } from '@/data/publications';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    return NextResponse.json({
      success: true,
      publications: publications
    });
    
  } catch (error) {
    console.error('Publications fetch error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const publicationData = await request.json();
    
    // Validate required fields
    if (!publicationData.title || !publicationData.author || !publicationData.content) {
      return NextResponse.json({
        success: false,
        error: 'Title, author, and content are required'
      }, { status: 400 });
    }
    
    // Generate new ID
    const newId = (publications.length + 1).toString();
    
    // Generate slug from title
    const slug = publicationData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    const newPublication: Publication = {
      id: newId,
      title: publicationData.title,
      author: publicationData.author,
      date: publicationData.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      readTime: publicationData.readTime || '5 min read',
      excerpt: publicationData.excerpt || publicationData.content.substring(0, 200) + '...',
      tags: publicationData.tags || [],
      category: publicationData.category || 'Research & Insights',
      featured: publicationData.featured || false,
      content: publicationData.content,
      slug: slug,
      publishedAt: new Date(),
      updatedAt: new Date(),
      sources: publicationData.sources || []
    };
    
    // Add to publications array
    publications.push(newPublication);
    
    // Write to file
    await updatePublicationsFile();
    
    return NextResponse.json({
      success: true,
      publication: newPublication,
      message: 'Publication created successfully'
    });
    
  } catch (error) {
    console.error('Publication creation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Publication ID is required'
      }, { status: 400 });
    }
    
    const publicationIndex = publications.findIndex(p => p.id === id);
    
    if (publicationIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Publication not found'
      }, { status: 404 });
    }
    
    // Update publication
    const updatedPublication = {
      ...publications[publicationIndex],
      ...updateData,
      updatedAt: new Date(),
      slug: updateData.title ? 
        updateData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim() : 
        publications[publicationIndex].slug
    };
    
    publications[publicationIndex] = updatedPublication;
    
    // Write to file
    await updatePublicationsFile();
    
    return NextResponse.json({
      success: true,
      publication: updatedPublication,
      message: 'Publication updated successfully'
    });
    
  } catch (error) {
    console.error('Publication update error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Publication ID is required'
      }, { status: 400 });
    }
    
    const publicationIndex = publications.findIndex(p => p.id === id);
    
    if (publicationIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Publication not found'
      }, { status: 404 });
    }
    
    const deletedPublication = publications[publicationIndex];
    
    // Remove from publications array
    publications.splice(publicationIndex, 1);
    
    // Write to file
    await updatePublicationsFile();
    
    return NextResponse.json({
      success: true,
      message: 'Publication deleted successfully',
      deletedPublication: deletedPublication
    });
    
  } catch (error) {
    console.error('Publication deletion error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function updatePublicationsFile() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/publications.ts');
    
    // Read the current file
    let fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Find the publications array and replace it
    const startMarker = 'export const publications: Publication[] = [';
    const endMarker = ']';
    
    const startIndex = fileContent.indexOf(startMarker);
    if (startIndex === -1) {
      throw new Error('Could not find publications array in file');
    }
    
    const arrayStart = startIndex + startMarker.length;
    const arrayEnd = fileContent.indexOf(endMarker, arrayStart);
    
    if (arrayEnd === -1) {
      throw new Error('Could not find end of publications array');
    }
    
    // Generate new publications array content
    const publicationsContent = publications.map(pub => {
      return `  {
    id: '${pub.id}',
    title: '${pub.title.replace(/'/g, "\\'")}',
    author: '${pub.author.replace(/'/g, "\\'")}',
    date: '${pub.date.replace(/'/g, "\\'")}',
    readTime: '${pub.readTime.replace(/'/g, "\\'")}',
    excerpt: '${pub.excerpt.replace(/'/g, "\\'")}',
    tags: [${pub.tags.map(tag => `'${tag.replace(/'/g, "\\'")}'`).join(', ')}],
    category: '${pub.category.replace(/'/g, "\\'")}',
    featured: ${pub.featured},
    content: \`${pub.content.replace(/`/g, '\\`')}\`,
    slug: '${pub.slug.replace(/'/g, "\\'")}',
    publishedAt: new Date('${pub.publishedAt.toISOString()}'),
    updatedAt: ${pub.updatedAt ? `new Date('${pub.updatedAt.toISOString()}')` : 'undefined'},
    sources: ${pub.sources ? JSON.stringify(pub.sources).replace(/"/g, "'") : 'undefined'}
  }`;
    }).join(',\n');
    
    // Replace the array content
    const newContent = fileContent.substring(0, arrayStart) + 
      '\n' + publicationsContent + '\n' + 
      fileContent.substring(arrayEnd);
    
    // Write back to file
    fs.writeFileSync(filePath, newContent, 'utf8');
    
  } catch (error) {
    console.error('Error updating publications file:', error);
    throw error;
  }
}
