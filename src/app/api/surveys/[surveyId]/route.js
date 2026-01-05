import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Survey from '@/lib/models/Survey';
import Response from '@/lib/models/Response';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET - survey look up (for edits)
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surveyId } = await params;

    await connectDB();

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

    // returning the number of responses together
    const responseCount = await Response.countDocuments({ survey: surveyId });

    return NextResponse.json({
      ...survey.toObject(),
      responseCount,
    });
  } catch (error) {
    console.error('Get survey error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - editing the survey contents
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surveyId } = await params;
    const { title, description, questions, anonymousResponses } = await request.json();

    await connectDB();

    const survey = await Survey.findOneAndUpdate(
      { _id: surveyId, creator: session.user.id },
      {
        title,
        description,
        questions,
        anonymousResponses,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Update survey error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - deleting the survey
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surveyId } = await params;

    await connectDB();

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

    await Response.deleteMany({ survey: surveyId });
    await Survey.deleteOne({ _id: surveyId });

    return NextResponse.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    console.error('Delete survey error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - enable/ diable the survey
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { surveyId } = await params;
    const { isActive } = await request.json();

    await connectDB();

    const survey = await Survey.findOneAndUpdate(
      { _id: surveyId, creator: session.user.id },
      { isActive },
      { new: true }
    );

    if (!survey) {
      return NextResponse.json(
        { error: 'Survey not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Update survey error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}