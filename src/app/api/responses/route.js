import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Response from '@/lib/models/Response';
import Survey from '@/lib/models/Survey';

export async function POST(request) {
  try {
    const { surveyId, answers, completionTime, respondent, isAnonymous } = await request.json();

    await connectDB();

    // checking survey
    const survey = await Survey.findById(surveyId);
    if (!survey || !survey.isActive) {
      return NextResponse.json(
        { error: 'Survey not available' },
        { status: 400 }
      );
    }

    
    if (!survey.anonymousResponses && !respondent) {
      return NextResponse.json(
        { error: 'Authentication required for this survey' },
        { status: 401 }
      );
    }

    const response = new Response({
      survey: surveyId,
      answers,
      completionTime,
      respondent: respondent || null,  
      isAnonymous: isAnonymous !== undefined ? isAnonymous : true, 
    });

    await response.save();

    return NextResponse.json(
      { message: 'Response submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit response error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}