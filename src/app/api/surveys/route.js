import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Survey from '@/lib/models/Survey';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const surveys = await Survey.find({ creator: session.user.id })
      .sort({ createdAt: -1 });

    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Get surveys error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('Session:', session);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, questions, anonymousResponses } = await request.json();

    await connectDB();

    const survey = new Survey({
      title,
      description,
      questions,
      anonymousResponses,
      creator: session.user.id,
    });

    await survey.save();

    return NextResponse.json(survey, { status: 201 });
  } catch (error) {
    console.error('Create survey error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}