import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Survey from '@/lib/models/Survey';

export async function GET(request, { params }) {
  try {
    await connectDB();

    const survey = await Survey.findOne({
      surveyCode: params.code,
      isActive: true,
    });

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