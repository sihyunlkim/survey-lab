import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Survey from '@/lib/models/Survey';

export async function GET(request, { params }) {
  try {
    // 👇 Next.js 16: params는 Promise!
    const resolvedParams = await params;
    const code = resolvedParams.code;
    
    console.log('=== SURVEY LOOKUP ===');
    console.log('Looking for code:', code);
    
    await connectDB();

    const survey = await Survey.findOne({
      surveyCode: code,
      isActive: true,
    });

    console.log('Survey found:', survey ? 'YES' : 'NO');
    if (survey) {
      console.log('Survey title:', survey.title);
    }
    console.log('===================');

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Get survey error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}