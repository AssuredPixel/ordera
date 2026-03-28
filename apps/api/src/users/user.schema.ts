import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '@ordera/shared';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  salesId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ required: true })
  restaurantId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
