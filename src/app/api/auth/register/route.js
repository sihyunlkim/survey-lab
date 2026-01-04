import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    const { email, password, name, institution } = await request.json();

    await connectDB();

    // checking existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    const user = new User({ email, password, name, institution });
    await user.save();

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: { id: user._id, email: user.email, name: user.name }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}