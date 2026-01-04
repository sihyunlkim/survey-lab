import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Response from '@/lib/models/Response';
import Survey from '@/lib/models/Survey';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surveyId } = await params;

    await connectDB();

    // checking the survey creator
    const survey = await Survey.findOne({
      _id: surveyId,
      creator: session.user.id,
    });

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found or unauthorized' },
        { status: 404 }
      );
    }

    const responses = await Response.find({ survey: surveyId })
      .sort({ submittedAt: -1 });

    // stats calculation 
    const stats = {
      totalResponses: responses.length,
      averageCompletionTime: responses.length > 0
        ? responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / responses.length
        : 0,
      responses: responses,
      survey: survey,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get responses error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
